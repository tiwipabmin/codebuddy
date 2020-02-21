const winston = require("winston");
const mongoose = require("mongoose");
const moment = require("moment");
const fs = require("fs");
const archiver = require("archiver");
const nodepty = require("node-pty");
const childprocess = require("child_process");

const Project = mongoose.model("Project");
const Message = mongoose.model("Message");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

module.exports = (io, client, redis, projects) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let curUser = "";
  let timerId = {};
  let comments = [];
  let index = null;
  let pythonProcess = null;
  let focusBlock = null;
  let bufferOutput = { output: "", error: "" };
  let isSpawnText = false;
  let executionCount = 0;

  spawnPython();
  detectOutput();

  winston.info("Client connected");

  /**
   * `join project` evnet trigged when user joining project in playground page
   * @param {Object} payload receive project id from client payload
   * after that socket will fire `init state` with editor code to initiate local editor
   */
  client.on("join project", async payload => {

    try {
      projectId = payload.pid;
      curUser = payload.username;
      winston.info(`User ${payload.username} joined at pid: ${payload.pid}`);
      client.join(projectId);

      console.log(" curUser ------------ " , curUser)

      
      let allcomment = await Comment.find(
        { pid: payload.pid },
        { file: 1, line: 1, description: 1, _id: 0 }
      ).sort({ line: 1 });

      for (let i in allcomment) {
        comments.push({
          file: allcomment[i].file,
          line: allcomment[i].line,
          description: allcomment[i].description
        });
      }

      Project.updateOne(
        {
          pid: projectId
        },
        {
          $set: {
            enable_time: Date.now()
          }
        },
        err => {
          if (err) throw err;
        }
      );

      /**
       * Increase user's enter count
       **/
      const user = await User.findOne({ username: curUser });
      const project = await Project.findOne({ pid: projectId });
      await Score.updateOne(
        { pid: projectId, uid: user._id },
        { $inc: { "participation.enter": 1 } }
      );

      /**
       * Check this project doesn't have any roles assigned.
       **/
      if (!projects[projectId]) {
        winston.info(`created new projects['${projectId}']`);
        let active_user = {};
        let partner = null;
        active_user[curUser] = 1;
        if (curUser === project.creator) {
          partner = project.collaborator;
        } else {
          partner = project.creator;
        }
        projects[projectId] = {
          roles: {
            coder: "",
            reviewer: "",
            reviews: []
          },
          active_user: active_user
        };
        client.emit("role selection", { partner: partner });
        console.log("line 107 : call initRemainder")
        initRemainder();
      } else {
        if (projects[projectId].active_user[curUser] === undefined) {
          await Project.findOne({ pid: projectId }, async function(err, res) {
            if (err) return handleError(err);
            projects[projectId].active_user[curUser] = 1;

            /**
             * Increase users' pairing count
             **/
            await Score.updateOne(
              { pid: projectId, uid: project.creator_id },
              { $inc: { "participation.pairing": 1 } }
            );
            await Score.updateOne(
              { pid: projectId, uid: project.collaborator_id },
              { $inc: { "participation.pairing": 1 } }
            );
            let numUser = Object.keys(projects[projectId].active_user).length;
            client.emit("role updated", {
              projectRoles: projects[projectId],
              project: res
            });
            io.in(projectId).emit("update status", {
              projectRoles: projects[projectId],
              status: 1,
              numUser: numUser
            });

            initRemainder();
          });
        } else {
          if (projects[projectId].reject === undefined) {
            projects[projectId].reject = 1;
          }
          client.emit("reject joining");
        }
      }
    } catch (error) {
      winston.info(`catching error: ${error}`);
    }
  });

  async function initRemainder() {
    client.emit("init state", {
      editor: await redis.hget(
        `project:${projectId}`,
        "editor",
        (err, res) => res
      )
    });
    io.in(projectId).emit("auto update score");
    client.emit("init reviews", comments);
  }

  client.on("clear interval", () => {
    clearInterval(timerId["codebuddy"]);
  });

  /**
   * `disconnect` event fired when user exit from playground page
   * by exit means: reload page, close page/browser, session lost
   */
  client.on("disconnect", () => {
    try {
      let numUser = Object.keys(projects[projectId].active_user).length;

      winston.info(
        `user left project ${projectId} now has ${numUser} user(s) online`
      );

      if (projects[projectId].reject) {
        delete projects[projectId].reject;
        client.leave(projectId);
      } else {
        clearInterval(timerId["codebuddy"]);
        /**
         * Some time, countdownTimer() is started by only one users.
         **/
        io.in(projectId).emit("clear interval");

        delete projects[projectId];
        io.in(projectId).emit("confirm role change", {
          projectRoles: projects[projectId],
          status: "disconnect",
          numUser: numUser
        });
        io.in(projectId).emit("update status", {
          projectRoles: projects[projectId],
          status: 0,
          numUser: numUser
        });

        client.leave(projectId);
        Project.updateOne(
          {
            pid: projectId
          },
          {
            $set: {
              disable_time: Date.now()
            }
          },
          err => {
            if (err) throw err;
          }
        );
      }
      winston.info("Client disconnected");
    } catch (error) {
      winston.info(`catching error: ${error}`);
    }
  });

  /**
   * set review to mongoDB
   **/
  client.on("submit review", payload => {
    var found = false;

    /**
     * if there's no comment in array => add to DB and array
     **/
    if (comments.length == 0) {
      saveComment(payload);
    } else {
      /**
       * edit comment in exist line => update in DB
       **/
      for (var i in comments) {
        if (
          comments[i].line == payload.line &&
          comments[i].file == payload.file
        ) {
          found = true;
          index = i;
        }
      }
      if (found) {
        if (payload.description == "") {
          Comment.findOne({
            file: payload.file,
            pid: projectId,
            line: payload.line
          })
            .remove()
            .exec();
          comments.splice(index, 1);
        } else {
          Comment.update(
            {
              file: payload.file,
              pid: projectId,
              line: payload.line
            },
            {
              $set: {
                description: payload.description
              }
            },
            err => {
              if (err) throw err;
            }
          );
          updateDesc(payload.file, payload.line, payload.description);
        }
      } else {
        saveComment(payload);
      }
    }
    io.in(projectId).emit("new review", comments);
  });

  client.on("delete review", payload => {
    Comment.findOne({
      file: payload.file,
      pid: projectId,
      line: payload.line
    })
      .remove()
      .exec();
    /**
     * remove deleted comment from list
     **/
    for (var i in comments) {
      if (
        comments[i].file == payload.file &&
        comments[i].line == payload.line
      ) {
        comments.splice(i, 1);
        break;
      }
    }

    io.in(projectId).emit("update after delete review", {
      comments: comments,
      file: payload.file,
      deleteline: payload.line
    });
  });

  /**
   * move hilight when enter or delete
   **/
  client.on("move hilight", payload => {
    var fileName = payload.fileName;
    var enterline = payload.enterline;
    var remove = payload.remove;
    var oldline = payload.oldline;
    var isEnter = payload.isEnter;
    var isDelete = payload.isDelete;
    comments = payload.comments;

    /**
     * check when enter new line
     **/
    if (isEnter) {
      for (var i in comments) {
        if (comments[i].line > enterline && comments[i].file == fileName) {
          Comment.update(
            {
              file: fileName,
              pid: projectId,
              description: comments[i].description
            },
            {
              $set: {
                line: comments[i].line
              }
            },
            err => {
              if (err) throw err;
            }
          );
        }
      }
    }

    /**
     * check when delete line
     **/
    if (isDelete) {
      for (var i in comments) {
        if (
          comments[i].line > parseInt(enterline) - 1 &&
          comments[i].file == fileName
        ) {
          Comment.update(
            {
              file: fileName,
              pid: projectId,
              description: comments[i].description
            },
            {
              $set: {
                line: comments[i].line
              }
            },
            err => {
              if (err) throw err;
            }
          );
        }
      }
    }
  });

  /**
   * `add block` event fired when user add new block
   * @param {Object} payload blockId
   */
  client.on("add block", payload => {
    /**
     * add new blockId to selected index
     **/
    payload.allBlockId.splice(payload.index, 0, payload.blockId);

    /**
     * save file name to mongoDB
     **/
    Project.update(
      {
        pid: projectId
      },
      {
        $set: {
          files: payload.allBlockId
        }
      },
      err => {
        if (err) throw err;
      }
    );

    // // Update JSON file
    // fs.readFile('./public/project_files/'+projectId+'/json.json', 'utf8', function (err, data) {
    //   if (err) throw err;

    //   // add block Obj to selected index
    //   var blocks = JSON.parse(data);
    //   blocks.splice(payload.index, 0, { id: payload.blockId, type: "code", source: "" });

    //   fs.writeFile('./public/project_files/'+projectId+'/json.json', JSON.stringify(blocks), function (err) {
    //     if (err) throw err;
    //   });
    // });

    io.in(projectId).emit("update block", {
      blockId: payload.blockId,
      index: payload.index,
      action: "add"
    });
  });

  /**
   * `delete block` event fired when user click delete block
   * @param {Object} payload fileName
   */
  client.on("delete block", async payload => {
    /**
     * delete block id in mongoDB
     **/
    Project.update(
      {
        pid: projectId
      },
      {
        $pull: {
          files: payload.blockId
        }
      },
      err => {
        if (err) throw err;
      }
    );

    /**
     * delete code in redis
     **/
    var code = JSON.parse(
      await redis.hget(`project:${projectId}`, "editor", (err, ret) => ret)
    );
    if (code != null) {
      delete code[payload.blockId];
      redis.hset(`project:${projectId}`, "editor", JSON.stringify(code));
    }

    // // Update JSON file
    // fs.readFile('./public/project_files/'+projectId+'/json.json', 'utf8', function (err, data) {
    //   if (err) throw err;

    //   // add block Obj to selected index
    //   var blocks = JSON.parse(data);

    //   fs.writeFile('./public/project_files/'+projectId+'/json.json', JSON.stringify(blocks), function (err) {
    //     if (err) throw err;
    //   });
    // });

    io.in(projectId).emit("update block", {
      blockId: payload.blockId,
      action: "delete"
    });
  });

  /**
   * `move block` event fired when user move block
   * @param {Object} payload fileName
   */
  client.on("move block", async payload => {
    /**
     * update block id in mongoDB
     **/
    Project.update(
      {
        pid: projectId
      },
      {
        files: payload.projectFiles
      },
      err => {
        if (err) throw err;
      }
    );
  });

  /**
   * `role selected` event fired when one of the project user select his role
   * @param {Ibject} payload user selected role and partner username
   * then socket will broadcast the role to his partner
   */
  client.on("role selected", payload => {
    countdownTimer();
    if (payload.select === 0) {
      projects[projectId].roles.reviewer = curUser;
      projects[projectId].roles.coder = payload.partner;
    } else {
      projects[projectId].roles.reviewer = payload.partner;
      projects[projectId].roles.coder = curUser;
    }
    Project.findOne({ pid: projectId }, function(err, res) {
      if (err) return handleError(err);
      io.in(projectId).emit("role updated", {
        projectRoles: projects[projectId],
        project: res
      });
    });
  });

  client.on("switch role", payload => {
    if (payload.action === undefined) {
      payload.action = "switch role";
    }
    clearInterval(timerId["codebuddy"]);
    switchRole(payload);
  });

  /**
   * `code change` event fired when user typing in editor
   * @param {Object} payload receive code from client payload
   */
  client.on("code change", payload => {
    const origin = !!payload.code.origin && payload.code.origin !== "setValue";
    /**
     * origin mustn't be an `undefined` or `setValue` type
     */
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(projectId).emit("editor update", payload.code);
      editorName = payload.fileName;
      redis.hgetall(`project:${projectId}`, function(err, obj) {
        var editorJson = {};
        if (obj.editor != undefined) {
          var editorJson = JSON.parse(obj.editor);
          console.log("editorJson", editorJson)
        }
        editorJson[editorName] = payload.editor;
        redis.hset(
          `project:${projectId}`,
          "editor",
          JSON.stringify(editorJson)
        );
      });

      /**
       * ------ history -----
       */
      var enterText = payload.code.text;
      var removeText = payload.code.removed;
      var action = payload.code.origin;
      var fromLine = payload.code.from.line;
      var fromCh = payload.code.from.ch;
      var toLine = payload.code.to.line;
      var toCh = payload.code.to.ch;
      var moreLine = false;
      var fileName = payload.fileName;

      for (var i = 0; i < removeText.length; i++) {
        if (removeText[i].length) {
          moreLine = true;
          break;
        }
      }

      /**
       * save input text to mongoDB
       */
      if (action == "+input") {
        if (enterText.length == 1) {
          /**
           * input ch
           */
          if (removeText[0].length != 0) {
            /**
             * select some text and add input
             */
            if (removeText.length == 1) {
              /**
               * select text in 1 line
               */
              deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
              updateTextAfter(
                projectId,
                fileName,
                fromLine,
                fromLine,
                fromCh + 1,
                toCh
              );
            } else if (
              (removeText.length > 1 && moreLine) ||
              (removeText[0].length == 0 && removeText[1].length == 0)
            ) {
              /**
               * select more than 1 line || delete line
               */
              deleteMoreLine(
                projectId,
                fileName,
                toLine,
                fromLine,
                fromCh,
                toCh,
                action
              );
            }
          } else {
            /**
             * move right ch of cursor
             */
            History.find(
              {
                pid: projectId,
                file: fileName,
                line: fromLine,
                ch: { $gte: fromCh }
              },
              { line: 1, ch: 1, text: 1, _id: 0 },
              function(err, res) {
                if (err) return handleError(err);
                var textInLine = res;
                for (var i = 0; i < textInLine.length; i++) {
                  History.update(
                    {
                      pid: projectId,
                      file: fileName,
                      line: textInLine[i].line,
                      ch: textInLine[i].ch,
                      text: textInLine[i].text
                    },
                    {
                      $set: {
                        line: fromLine,
                        ch: fromCh + i + 1
                      }
                    },
                    err => {
                      if (err) throw err;
                    }
                  );
                }
              }
            );
          }

          /**
           * save ch to mongoDB
           */
          const historyModel = {
            pid: projectId,
            file: fileName,
            line: fromLine,
            ch: fromCh,
            text: payload.code.text.toString(),
            user: payload.user,
            createdAt: Date.now()
          };
          new History(historyModel, err => {
            if (err) throw err;
          }).save();
        } else if (enterText.length == 2) {
          /**
           * enter new line
           * first line -> move right ch of cursor to new line
           */
          if (removeText[0].length != 0) {
            /**
             * enter delete text
             */
            deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
          }

          History.find(
            {
              pid: projectId,
              file: fileName,
              line: fromLine,
              ch: { $gte: fromCh }
            },
            { line: 1, ch: 1, text: 1, _id: 0 },
            function(err, res) {
              if (err) return handleError(err);
              var textInLine = res;
              for (var i = 0; i < textInLine.length; i++) {
                History.update(
                  {
                    pid: projectId,
                    file: fileName,
                    line: textInLine[i].line,
                    ch: textInLine[i].ch,
                    text: textInLine[i].text
                  },
                  {
                    $set: {
                      line: fromLine + 1,
                      ch: i
                    }
                  },
                  err => {
                    if (err) throw err;
                  }
                );
              }
            }
          );

          /**
           * not first line -> line+1
           */
          History.find(
            { pid: projectId, file: fileName, line: { $gt: fromLine } },
            { line: 1, ch: 1, text: 1, _id: 0 },
            function(err, res) {
              if (err) return handleError(err);
              var textInLine = res;

              for (var i = 0; i < textInLine.length; i++) {
                History.update(
                  {
                    pid: projectId,
                    file: fileName,
                    line: textInLine[i].line,
                    ch: textInLine[i].ch,
                    text: textInLine[i].text
                  },
                  {
                    $set: {
                      line: textInLine[i].line + 1
                    }
                  },
                  err => {
                    if (err) throw err;
                  }
                );
              }
            }
          );
        }
      } else if (action == "+delete") {
        /**
         * delete text from mongoDB
         */
        if (removeText.length == 1) {
          /**
           * delete select text
           */
          deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
          updateTextAfter(
            projectId,
            fileName,
            fromLine,
            fromLine,
            fromCh,
            toCh
          );
        } else if (
          (removeText.length > 1 && moreLine) ||
          (removeText[0].length == 0 && removeText[1].length == 0)
        ) {
          /**
           * delete more than 1 line || delete line
           */
          deleteMoreLine(
            projectId,
            fileName,
            toLine,
            fromLine,
            fromCh,
            toCh,
            action
          );
        }
      }
      /**
       * ------ end history -----
       */
    }
  });

  /**
   * `user status` event fired every 3 seconds for checking user status
   * @param {Object} payload user status from client-side
   */
  client.on("user status", payload => {
    client.to(projectId).emit("update status", payload);
  });

  client.on("codemirror on focus", payload => {
    io.in(projectId).emit("update block highlight", {
      prevFocus: payload.prevFocus,
      newFocus: payload.newFocus
    });
  });

  /**
   * `run code` event fired when user click on run button from front-end
   * @param {Object} payload code from editor
   */
  client.on("run code", payload => {
    console.log(" run code 2 ")
    var codeFocusBlock = payload.codeFocusBlock;
    console.log("codeFocusBlock ", codeFocusBlock)
    focusBlock = payload.focusBlock;
    console.log("focusBlock ", focusBlock)
    isSpawnText = false;

    io.in(projectId).emit("focus block", focusBlock);

    // save code
    fs.writeFile(
      "./public/project_files/" + projectId + "/main.py",
      codeFocusBlock,
      err => {
        if (err) throw err;
      }
    );

    setTimeout(execCode, 100);

    function execCode() {
      /**
       * built-in functions of python version 2.7
       */
      // runpty.stdin.write('execfile(\"./public/project_files/'+projectId+'/main.py\")\n');

      /**
       * built-in functions of python version 3
       */
      pythonProcess.stdin.write(
        "exec(open('./public/project_files/" +
          projectId +
          "/main.py').read())\n"
      );
      console.log("pythonProcess: ", pythonProcess)
    }

    // setTimeout(runpty.kill.bind(runpty), 3000);

    /**
     * display In[*]
     */
    io.in(projectId).emit("update execution count", "*");
  });

  /**
   * restart a kernel when user click on reKernel from front-end
   */
  client.on("restart a kernel", payload => {
    console.log("restart a kernel")
    executionCount = 0;
    spawnPython();
    detectOutput();
    io.in(projectId).emit("restart a kernel");
  });

  function spawnPython() {
    pythonProcess = childprocess.spawn("python", ["-i"], {});
    console.log(" spawnPython pythonProcess " , pythonProcess)
    isSpawnText = true;
  }

  function detectOutput() {
    console.log("detectOutput()")
    /**
     * detection output is a execution code
     */
    pythonProcess.stdout.on("data", data => {
      if (bufferOutput.error == "" && data.toString() != "") {
        bufferOutput.output = data.toString();
      }
    });
    /**
     * detection code execute error
     */
    pythonProcess.stderr.on("data", data => {
      output = data.toString();

      var arrowLocation = output.indexOf(">>>");
      var drawArrow = "";

      if (arrowLocation == 0) {
        drawArrow = output.slice(0, 3);
      } else {
        drawArrow = output.slice(arrowLocation, arrowLocation + 3);
        output = output.slice(0, arrowLocation - 1);
      }

      if (output.indexOf("Error") != -1) {
        bufferOutput.error += output;
      } else if (drawArrow != ">>>" && !isSpawnText) {
        bufferOutput.error = bufferOutput.error + output + "\n";
      }

      /**
       * execute code process finised
       */
      if (drawArrow == ">>>" && !isSpawnText) {
        console.log(" execute code process finised")
        if (bufferOutput.error == "" && bufferOutput.output != "") {
          output = bufferOutput.output;
        } else {
          output = bufferOutput.error;
        }

        if (output != "") {
          io.in(projectId).emit("show output", output);
        }

        bufferOutput.output = "";
        bufferOutput.error = "";

        /**
         * increment execution count
         */
        io.in(projectId).emit("update execution count", ++executionCount);
      }
    });
  }

  /**
   * `pause running code` event fired when user click on pause button from front-end
   * @param {Object} payload code from editor
   */
  client.on("pause run code", payload => {
    if (pythonProcess != undefined) {
      setTimeout(pythonProcess.kill.bind(pythonProcess), 0);
    }
    io.in(projectId).emit("pause run code");
  });

  /**
   * `send message` event fired when user send chat message from front-end
   * @param {Object} payload code from editor
   */
  client.on("send message", payload => {
    const message = payload.message;
    const uid = payload.uid;
    const messageModel = {
      pid: projectId,
      uid: uid,
      message: message,
      createdAt: Date.now()
    };
    new Message(messageModel, err => {
      if (err) throw err;
    }).save();
    const user = User.where({ _id: uid }).findOne(function(err, user) {
      if (err);
      if (user) {
        const response = {
          user: user,
          message: messageModel
        };
        io.in(projectId).emit("update message", response);
      }
    });
  });

  /**
   * `send active tab` event fired when user change tab
   * @param {Object} payload active tab
   */
  client.on("send active tab", payload => {
    io.in(projectId).emit("show partner active tab", payload);
  });

  client.on("open tab", async payload => {
    var fileName = payload;
    var code = await redis.hget(
      `project:${projectId}`,
      "editor",
      (err, ret) => ret
    );
    io.in(projectId).emit("set editor open tab", {
      fileName: fileName,
      editor: code
    });
  });

  client.on("is typing", payload => {
    io.in(projectId).emit("is typing", payload);
  });

  /**
   * `reviewer active time` event fired reviewer active time every 1 sec
   * @param {Object} payload time from face detection on main.js
   */
  client.on("reviewer active time", payload => {
    io.in(projectId).emit("show reviewer active time", payload);
  });

  client.on("save active time", async payload => {
    const score = await Score.findOne({
      pid: projectId,
      uid: payload.uid
    });

    await Score.update(
      {
        pid: projectId,
        uid: payload.uid
      },
      {
        $set: {
          time: parseInt(score.time) + parseInt(payload.time)
        }
      }
    );

    const user = await User.findOne({
      _id: payload.uid
    });

    await User.update(
      {
        _id: payload.uid
      },
      {
        $set: {
          totalTime: parseInt(user.totalTime) + parseInt(payload.time)
        }
      }
    );
  });

  client.on("save lines of code", payload => {
    History.aggregate([
      { $match: { user: curUser, pid: projectId } },
      { $group: { _id: { file: "$file", line: "$line" } } }
    ]).then(function(res) {
      Score.where({ pid: projectId, uid: payload.uid }).findOne(function(
        err,
        score
      ) {
        if (err);
        if (score) {
          Score.update(
            {
              pid: projectId,
              uid: payload.uid
            },
            {
              $set: {
                lines_of_code: parseInt(res.length)
              }
            },
            err => {
              if (err) throw err;
            }
          );
        }
      });
    });
  });

  /**
   * `submit code` event fired when user click on submit button from front-end
   * @param {Object} payload code from editor
   */
  client.on("submit code", payload => {
    const mode = payload.mode;
    const uid = payload.uid;
    const code = payload.code;
    let pylintProcess;
    var args = ["-j", "4"];

    Object.keys(code).forEach(function(key) {
      args.push("./public/project_files/" + projectId + "/" + key + ".py");
      // fs.writeFile(
      //   "./public/project_files/" + projectId + "/" + key + ".py",
      //   code[key],
      //   err => {
      //     if (err) throw err;
      //   }
      // );
    });

    if (process.platform === "win32") {
      pylintProcess = nodepty.spawn("pylint.exe", args, {});
    } else {
      pylintProcess = nodepty.spawn("pylint", args, {});
    }

    pylintProcess.on("data", data => {
      /**
       * get score from pylint
       */
      const before_score = data.indexOf("Your code has been rated at");
      let score = 0;
      if (before_score != -1) {
        const after_score = data.indexOf("/10");
        score = data.slice(before_score + 28, after_score);
      } else if (data.indexOf("E:") < 0) {
        score = 0;
      }
      data = data.replace(/\/10/g, "/100.00");
      Project.where({ pid: projectId }).findOne(function(err, project) {
        if (err);
        if (project) {
          if (project.creator_id != null && project.collaborator_id != null) {
            const users = [project.creator_id, project.collaborator_id];
            users.forEach(function(element) {
              const scoreModel = {
                pid: projectId,
                uid: element,
                score: score,
                time: 0,
                lines_of_code: 0,
                error_count: 0,
                participation: {
                  enter: 0,
                  pairing: 0
                },
                createdAt: Date.now()
              };
              Score.where({ pid: projectId, uid: element }).findOne(function(
                err,
                oldScore
              ) {
                if (err) throw err;
                if (!oldScore) {
                  new Score(scoreModel, err => {
                    if (err) throw err;
                  }).save();

                  /**
                   * recalculate score
                   */
                  sumScore = Score.aggregate(
                    [
                      {
                        $match: {
                          uid: element
                        }
                      },
                      {
                        $group: {
                          _id: "$uid",
                          avg: { $avg: "$score" }
                        }
                      }
                    ],
                    function(err, results) {
                      if (err) {
                        console.log(err);
                        return;
                      }
                      if (results) {
                        // sum = 0;
                        results.forEach(function(result) {
                          /**
                           * start update
                           */
                          User.update(
                            {
                              _id: element
                            },
                            {
                              $set: {
                                avgScore: result.avg
                              }
                            },
                            function(err, userReturn) {
                              if (err);
                              if (userReturn) {
                                console.log(userReturn);
                              }
                            }
                          );
                          /**
                           * end update
                           */
                          const shownScore = {
                            score: score,
                            uid: element,
                            avgScore: result.avg
                          };
                          if (mode == "auto") {
                            io.in(projectId).emit(
                              "show auto update score",
                              shownScore
                            );
                          } else {
                            io.in(projectId).emit("show score", shownScore);
                            io.in(projectId).emit(
                              "show auto update score",
                              shownScore
                            );
                          }
                        });
                      }
                    }
                  );
                  /**
                   * end recalculate score
                   */
                }
                if (oldScore) {
                  Score.update(
                    {
                      pid: projectId,
                      uid: element
                    },
                    {
                      $set: {
                        score: score
                      }
                    },
                    function(err, scoreReturn) {
                      if (err) throw err;
                      if (scoreReturn) {
                        /**
                         * recalculate score
                         */
                        sumScore = Score.aggregate(
                          [
                            {
                              $match: {
                                uid: element
                              }
                            },
                            {
                              $group: {
                                _id: "$uid",
                                avg: { $avg: "$score" }
                              }
                            }
                          ],
                          function(err, results) {
                            if (err) {
                              console.log(err);
                              return;
                            }
                            if (results) {
                              // sum = 0;
                              results.forEach(function(result) {
                                /**
                                 * start update
                                 */
                                User.update(
                                  {
                                    _id: element
                                  },
                                  {
                                    $set: {
                                      avgScore: result.avg
                                    }
                                  },
                                  function(err, userReturn) {
                                    if (err);
                                    if (userReturn) {
                                      console.log(userReturn);
                                    }
                                  }
                                );
                                /**
                                 * end update
                                 */
                                const shownScore = {
                                  score: score,
                                  uid: element,
                                  avgScore: result.avg
                                };
                                if (mode == "auto") {
                                  io.in(projectId).emit(
                                    "show auto update score",
                                    shownScore
                                  );
                                } else {
                                  io.in(projectId).emit(
                                    "show score",
                                    shownScore
                                  );
                                  io.in(projectId).emit(
                                    "show auto update score",
                                    shownScore
                                  );
                                }
                              });
                            }
                          }
                        );
                        /**
                         * end recalculate score
                         */
                      }
                    }
                  );
                }
              });
            }, this);
          }
        }
      });
      io.in(projectId).emit("term update", data);
    });
  });

  client.on("export file", payload => {
    var fileNameList = payload.fileNameList;
    var code = payload.code;

    for (var i in fileNameList) {
      fs.writeFile(
        "./public/project_files/" + projectId + "/" + fileNameList[i] + ".py",
        code[fileNameList[i]],
        err => {
          if (err) throw er;
        }
      );
    }

    var output = fs.createWriteStream(
      "./public/project_files/" + projectId + "/" + projectId + ".zip"
    );
    var archive = archiver("zip", {
      gzip: true,
      zlib: { level: 9 } // Sets the compression level.
    });
    archive.on("error", function(err) {
      throw err;
    });

    /**
     * pipe archive data to the output file
     */
    archive.pipe(output);
    /**
     * append files
     */
    fileNameList.forEach(function(fileName) {
      archive.file(
        "./public/project_files/" + projectId + "/" + fileName + ".py",
        { name: fileName + ".py" }
      );
    });
    archive.finalize();
    client.emit("download file", projectId);
  });

  /**
   * This function is started by first only user.
   */
  function countdownTimer() {
    function intervalFunc() {
      redis.hgetall(`project:${projectId}`, function(err, obj) {
        var start = new Date(parseInt(obj.startTime));
        let minutes = moment
          .duration(swaptime - (Date.now() - start))
          .minutes();
        let seconds = moment
          .duration(swaptime - (Date.now() - start))
          .seconds();
        flag = 0;
        if (seconds == 0 && flag != 1) {
          flag = 1;
          io.in(projectId).emit("auto update score");
        } else {
          flag = 0;
        }
        io.in(projectId).emit("countdown", {
          minutes: minutes,
          seconds: seconds
        });
        if (minutes <= 0 && seconds <= 0) {
          let numUser = Object.keys(projects[projectId].active_user).length;
          clearInterval(timerId["codebuddy"]);
          io.in(projectId).emit("confirm role change", {
            projectRoles: projects[projectId],
            status: "connect",
            numUser: numUser
          });
        }
      });
    }
    let query = Project.where({ pid: projectId });
    let swaptime = query.findOne(function(err, project) {
      if (err) return 300000;
      if (project) {
        return (swaptime = parseInt(project.swaptime) * 60 * 1000);
      }
    });
    timerId["codebuddy"] = setInterval(intervalFunc, 1000);
    redis.hset(`project:${projectId}`, "startTime", Date.now().toString());
  }

  function switchRole(payload) {
    countdownTimer();
    /**
     * if This project hasn't have any roles assigned.
     */
    if (!projects[projectId]) {
      winston.info(`created new projects['${projectId}'] - fix bug version`);
      let active_user = {};
      active_user[curUser] = 1;
      projects[projectId] = {
        roles: {
          coder: "",
          reviewer: "",
          reviews: []
        },
        count: 1,
        active_user: active_user
      };
      client.emit("role selection");
    } else if (payload.action === "switch role") {
      let numUser = Object.keys(projects[projectId].active_user).length;
      if (
        numUser == 2 ||
        (projects[projectId].roles.reviewer === payload.user && numUser == 1)
      ) {
        const temp = projects[projectId].roles.coder;
        projects[projectId].roles.coder = projects[projectId].roles.reviewer;
        projects[projectId].roles.reviewer = temp;
        Project.findOne({ pid: projectId }, function(err, res) {
          if (err) return handleError(err);
          io.in(projectId).emit("role updated", {
            projectRoles: projects[projectId],
            project: res
          });
        });
      }
    }
  }

  function saveComment(payload) {
    const commentModel = {
      file: payload.file,
      line: parseInt(payload.line),
      pid: projectId,
      description: payload.description,
      createdAt: Date.now()
    };
    new Comment(commentModel, err => {
      if (err) throw err;
    }).save();
    comments.push({
      file: payload.file,
      line: parseInt(payload.line),
      description: payload.description
    });
  }

  function updateDesc(file, line, description) {
    for (var i in comments) {
      if (comments[i].file == file && comments[i].line == line) {
        comments[i].description = description;
        break;
      }
    }
  }

  function readAppend(file, appendFile) {
    fs.readFile(appendFile, function(err, data) {
      if (err) throw err;
      fs.appendFile(file, "\n", function(err) {});
      fs.appendFile(file, data, function(err) {});
    });
  }

  function deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh) {
    History.find({
      pid: projectId,
      file: fileName,
      line: fromLine,
      ch: { $gte: fromCh, $lt: toCh }
    })
      .remove()
      .exec();
  }

  function deleteMoreLine(
    projectId,
    fileName,
    toLine,
    fromLine,
    fromCh,
    toCh,
    action
  ) {
    var lineRange = toLine - fromLine;
    for (var i = fromLine; i <= fromLine + lineRange; i++) {
      /**
       * first line
       **/
      if (i == fromLine) {
        History.findOne({
          pid: projectId,
          file: fileName,
          line: i,
          ch: { $gte: fromCh }
        })
          .remove()
          .exec();
      } else if (i != fromLine + lineRange) {
        /**
         * not last line
         **/
        History.find({
          pid: projectId,
          file: fileName,
          line: i
        })
          .remove()
          .exec();
      } else {
        /**
         * last line
         **/
        History.find({
          pid: projectId,
          file: fileName,
          line: i,
          ch: { $lt: toCh }
        })
          .remove()
          .exec();

        if (action == "+input") {
          updateTextAfter(projectId, fileName, i, fromLine, fromCh + 1, toCh);
        } else {
          updateTextAfter(projectId, fileName, i, fromLine, fromCh, toCh);
        }
      }
    }
  }

  function updateTextAfter(projectId, fileName, line, fromLine, fromCh, toCh) {
    History.find(
      { pid: projectId, file: fileName, line: line, ch: { $gte: toCh } },
      { line: 1, ch: 1, text: 1, _id: 0 },
      function(err, res) {
        if (err) return handleError(err);
        var textInLine = res;
        for (var i = 0; i < textInLine.length; i++) {
          History.update(
            {
              pid: projectId,
              file: fileName,
              line: textInLine[i].line,
              ch: textInLine[i].ch,
              text: textInLine[i].text
            },
            {
              $set: {
                line: fromLine,
                ch: fromCh + i
              }
            },
            err => {
              if (err) throw err;
            }
          );
        }
      }
    );
  }
};
