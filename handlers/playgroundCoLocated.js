const winston = require("winston");
const mongoose = require("mongoose");
const fs = require("fs");
const archiver = require("archiver");
const nodepty = require("node-pty");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");

const Project = mongoose.model("Project");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const History = mongoose.model("History");

module.exports = (io, client, redis, projects) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let curUser = "";
  var detectInput = "empty@Codebuddy";
  let pythonProcess = null;

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

      Project.update(
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
      await Score.update(
        { pid: projectId, uid: user._id },
        { $push: { "participation.enter": new Date() } }
      );

      /**
       * Checking if this project hasn't have any roles assigned.
       **/
      if (!projects[projectId]) {
        winston.info(`created new projects['${projectId}']`);

        let active_user = {};
        projects[projectId] = {
          roles: {
            coder: "",
            reviewer: "",
            reviews: []
          },
          active_user: active_user
        };

        initRemainder();
      } else {
        if (projects[projectId].reject === undefined) {
          projects[projectId].reject = 1;
        }
        client.emit("reject joining");
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
    client.emit("auto update score");
  }

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
        delete projects[projectId];

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
   * `create file` event fired when user click create new file
   * @param {Ibject} payload fileName
   */
  client.on("create file", payload => {
    //save file name to mongoDB
    Project.update(
      {
        pid: projectId
      },
      {
        $push: {
          files: payload
        }
      },
      err => {
        if (err) throw err;
      }
    );

    /**
     * create new file  ./public/project_files/projectId/fileName.py
     **/
    fs.open(
      "./public/project_files/" + projectId + "/" + payload + ".py",
      "w",
      function(err, file) {
        if (err) throw err;
      }
    );

    io.in(projectId).emit("update tab", {
      fileName: payload,
      action: "create"
    });
  });

  /**
   * `delete file` event fired when user click delete file
   * @param {Ibject} payload fileName
   */
  client.on("delete file", async payload => {
    /**
     * delete file in mongoDB
     **/
    Project.update(
      {
        pid: projectId
      },
      {
        $pull: {
          files: payload
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
      delete code[payload];
      redis.hset(`project:${projectId}`, "editor", JSON.stringify(code));
    }

    /**
     * delete file
     **/
    fs.unlink(
      "./public/project_files/" + projectId + "/" + payload + ".py",
      function(err) {
        if (err) throw err;
      }
    );

    io.in(projectId).emit("update tab", {
      fileName: payload,
      action: "delete"
    });
  });

  /**
   * `code change` event fired when user typing in editor
   * @param {Object} payload receive code from client payload
   */
  client.on("code change", payload => {
    const origin = !!payload.code.origin && payload.code.origin !== "setValue";
    /**
     * origin mustn't be an `undefined` or `setValue` type
     **/
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(projectId).emit("editor update", payload.code);
      editorName = payload.fileName;
      redis.hgetall(`project:${projectId}`, function(err, obj) {
        var editorJson = {};
        if (obj.editor != undefined) {
          var editorJson = JSON.parse(obj.editor);
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
       **/
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
       **/
      if (action == "+input") {
        if (enterText.length == 1) {
          /**
           * input ch
           **/
          if (removeText[0].length != 0) {
            //select some text and add input
            if (removeText.length == 1) {
              /**
               * select text in 1 line
               **/
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
               **/
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
             **/
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
           **/
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
           **/
          if (removeText[0].length != 0) {
            /**
             * enter delete text
             **/
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
           **/
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
         **/
        if (removeText.length == 1) {
          /**
           * delete select text
           **/
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
           **/
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
       **/
    }
  });

  /**
   * `run code` event fired when user click on run button from front-end
   * @param {Object} payload code from editor
   */
  client.on("run code", payload => {
    var code = payload.code;
    Object.keys(code).forEach(function(key) {
      fs.writeFile(
        "./public/project_files/" + projectId + "/" + key + ".py",
        code[key],
        err => {
          if (err) throw err;
        }
      );
    });

    if (process.platform === "win32") {
      pythonProcess = nodepty.spawn(
        "python.exe",
        ["./public/project_files/" + projectId + "/" + "main.py"],
        {}
      );
    } else {
      pythonProcess = nodepty.spawn(
        "python3",
        ["./public/project_files/" + projectId + "/" + "main.py"],
        {}
      );
    }

    pythonProcess.on("data", data => {
      /**
       * check is code error
       **/
      if (
        data.indexOf("Error") != -1 ||
        data.indexOf("Traceback (most recent call last):") != -1
      ) {
        /**
         * increase error_count of user
         **/
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
                  error_count: parseInt(score.error_count) + 1
                }
              },
              err => {
                if (err) throw err;
              }
            );
          }
        });
      }

      /**
       * Resolve the output get echo the input ex. input is 'input', output is 'input input'
       **/
      let splitData = data.split("\n");
      if (detectInput !== "empty@Codebuddy") {
        if (splitData[0].indexOf(String.valueOf(detectInput))) {
          data = splitData.slice(1, splitData.length).join("\n");
          detectInput = "empty@Codebuddy";
        }
      }

      io.in(projectId).emit("term update", data);
    });
    // setTimeout(pythonProcess.kill.bind(pythonProcess), 1000);
  });

  /**
   * `run code` event fired when user click on run button from front-end
   * @param {Object} payload code from editor
   */
  client.on("typing input on term", payload => {
    var inputTerm = payload.inputTerm;
    detectInput = inputTerm;
    if (pythonProcess !== undefined) {
      pythonProcess.write(inputTerm + "\r");
    }
  });

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
    // const uid = payload.uid
    const code = payload.code;

    /**
     * Check python files not empty at line 695 - 707
     **/
    let split_code = "";
    let join_code = "";
    let empty = true;
    let count_error = 0;
    let count_file = 0;

    for (var key in code) {
      count_file++;
      let element_ = code[key];
      split_code = element_.split("\n");
      join_code = split_code.join("");
      split_code = join_code.split(" ");
      join_code = split_code.join("");

      if (join_code != "") {
        empty = false;
      } else {
        count_error++;
      }
    }

    let pylintProcess;
    var args = ["-j", "1"];

    Object.keys(code).forEach(function(key) {
      args.push("./public/project_files/" + projectId + "/" + key + ".py");
      fs.writeFile(
        "./public/project_files/" + projectId + "/" + key + ".py",
        code[key],
        err => {
          if (err) throw err;
        }
      );
    });

    if (process.platform === "win32") {
      pylintProcess = nodepty.spawn("pylint.exe", args, {});
    } else {
      pylintProcess = nodepty.spawn("pylint", args, {});
    }

    /**
     * This listener may be send data three times per one process or more
     **/
    pylintProcess.on("data", data => {
      /** get score from the message of pylint that's
       *  " ************* Module main
       *    public\project_files\FUNmY7nU8h\main.py:1:0: C0304: Final newline missing (missi
       *    ng-final-newline)
       *    public\project_files\FUNmY7nU8h\main.py:1:0: C0111: Missing module docstring (mi
       *    ssing-docstring)
       *    --------------------------------------------------------------------
       *    Your code has been rated at 80.00/100.00 (previous run: 80.00/100.00, +0.00) "
       **/
      const before_score = data.indexOf("Your code has been rated at");
      let score = 0;
      if (before_score != -1) {
        const after_score = data.indexOf("/10");
        score = data.slice(before_score + 28, after_score);
      }
      // else if (data.indexOf('E:') < 0) {
      //   // console.log('data, ', data, ', data.indexOf(\'E:\'), ', data.indexOf('E:'))
      //   score = 0
      // }
      data = data.replace(/\/10/g, "/100.00");

      /**
       * as the listener may be send data three times per one process or more,
       * so the score of project must to save once.
       * The line of process is 757 to 903
       **/
      if (
        (!empty &&
          score == 0 &&
          data.indexOf("(syntax-error)") != -1 &&
          count_error == 0 &&
          count_file == 1) ||
        (!empty && data.indexOf("Your code has been rated at") != -1) ||
        (empty && score == 0 && data.indexOf("public\\project_files\\") == -1)
      ) {
        if (data.indexOf("(syntax-error)") != -1) {
          count_error++;
        }
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
                    enter: [new Date()],
                    pairing: []
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
                     **/
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
                             **/
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
                             **/
                            const shownScore = {
                              score: score,
                              uid: element,
                              avgScore: result.avg
                            };
                            if (mode == "auto") {
                              client.emit(
                                "show auto update score",
                                shownScore
                              );
                            } else {
                              client.emit("show score", shownScore);
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
                     **/
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
                      async function(err, scoreReturn) {
                        if (err) throw err;
                        if (scoreReturn) {
                          /**
                           * recalculate score
                           **/
                          sumScore = await Score.aggregate(
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
                                   **/
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
                                   **/
                                  const shownScore = {
                                    score: score,
                                    uid: element,
                                    avgScore: result.avg
                                  };
                                  if (mode == "auto") {
                                    client.emit(
                                      "show auto update score",
                                      shownScore
                                    );
                                  } else {
                                    client.emit(
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
                           **/
                        }
                      }
                    );
                  }
                });
              }, this);
            }
          }
        });
      }
      io.in(projectId).emit("term update", data);
    });
  });

  client.on("export file", payload => {
    let fileNameList = payload.fileNameList;
    let fileNameListLength = Object.keys(fileNameList).length;
    let code = payload.code;
    let filePath = "../project_files/" + projectId + "/main.py";

    for (let index in fileNameList) {
      fs.writeFile(
        "./public/project_files/" +
          projectId +
          "/" +
          fileNameList[index] +
          ".py",
        code[fileNameList[index]],
        err => {
          if (err) throw er;
        }
      );
    }

    if (fileNameListLength > 1) {
      filePath = "../project_files/" + projectId + "/" + projectId + ".zip";
      let output = fs.createWriteStream(
        "./public/project_files/" + projectId + "/" + projectId + ".zip"
      );

      let archive = archiver("zip", {
        gzip: true,
        /**
         * Sets the compression level.
         **/
        zlib: { level: 9 }
      });

      archive.on("error", function(err) {
        throw err;
      });
      /**
       * pipe archive data to the output file
       **/
      archive.pipe(output);
      /**
       * append files
       **/
      fileNameList.forEach(function(fileName) {
        archive.file(
          "./public/project_files/" + projectId + "/" + fileName + ".py",
          { name: fileName + ".py" }
        );
      });
      archive.finalize();
    }

    client.emit("download file", {
      projectId: projectId,
      fileNameListLength: fileNameListLength,
      filePath: cryptr.encrypt(filePath)
    });
  });

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
