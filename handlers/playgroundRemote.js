const winston = require("winston");
const mongoose = require("mongoose");
const moment = require("moment");
const fs = require("fs");
const archiver = require("archiver");
const nodepty = require("node-pty");
const Cryptr = require("cryptr");
const { disconnect } = require("process");
const cryptr = new Cryptr("codebuddy");

const Project = mongoose.model("Project");
const ProjectSession = mongoose.model("ProjectSession");
const Message = mongoose.model("Message");
const Notification = mongoose.model("Notification");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

module.exports = (io, client, redis, projects, keyStores, timerIds) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let sectionId = "";
  let curUser = "";
  let projectSessionId = "";
  let detectInput = "empty@Codebuddy";
  let timerId = {};
  let comments = [];
  let index = null;
  let pythonProcess = null;
  let beat = 0;
  let pingPongId = "";
  let autoDiscId = "";

  /**
   * `sendHeartbeat` function that sends heartbeat to client so that client send it back.
   */
  function sendHeartbeat() {
    client.emit("PING", { beat: beat });
  }

  /**
   * `autoDisconnect` function that automatically disconnects from client.
   */
  function autoDisconnect() {
    client.disconnect();
  }

  /**
   * `PONG` event that check the client is connected.
   */
  client.on("PONG", (payload) => {
    if (payload.beat > beat) {
      beat = payload.beat;
      pingPongId = setTimeout(sendHeartbeat, 5000);
      clearTimeout(autoDiscId);
      autoDiscId = setTimeout(autoDisconnect, 6000);
    } else {
      clearTimeout(pingPongId);
    }
  });

  /**
   * `join project` event trigged when user joining project in playground page
   * @param {Object} payload receive project id from client payload
   * after that socket will fire `init state` with editor code to initiate local editor
   */
  client.on("join project", async (payload) => {
    try {
      projectId = payload.pid;
      curUser = payload.username;
      sectionId = cryptr.decrypt(payload.sectionId);

      const user = await User.findOne({ username: curUser }, (err, res) => {
        if (err) throw err;
        return res;
      });

      const project = await Project.findOne({ pid: projectId }, (err, res) => {
        if (err) throw err;
        return res;
      });

      if (!projects[projectId]) {
        const partner =
          curUser !== project.creator ? project.creator : project.collaborator;

        const activeUsers = {};
        activeUsers[curUser] = 1;
        projects[projectId] = {
          roles: {
            coder: curUser,
            reviewer: partner,
          },
          activeUsers: activeUsers,
        };

        /**
         * Join session socket with project id
         */
        client.join(projectId);
        startHeartbeat();

        client.emit("start the project session", {});

        initRemainder(curUser, project);
        createProjectNotification(curUser, project);
      } else {
        if (projects[projectId].activeUsers[curUser] === undefined) {
          await Project.findOne({ pid: projectId }, async function (err, res) {
            if (err) throw err;
            if (res) {
              projects[projectId].activeUsers[curUser] = 1;

              /**
               * Join session socket with project id
               */
              client.join(projectId);
              startHeartbeat();

              io.in(projectId).emit("update status", {
                status: 1,
              });

              io.in(projectId).emit("clear interval", `dwellingtimer`);
              io.in(projectId).emit("start the project session", {});

              initRemainder(curUser, project);
              countdownTimer();
              io.in(projectId).emit("role timer");
            } else {
              client.disconnect();
            }
          });
        } else {
          if (projects[projectId].kickOff === undefined) {
            projects[projectId].kickOff = 1;
          } else {
            projects[projectId].kickOff += 1;
          }
          client.emit("denied to join");
        }
      }
    } catch (err) {
      console.error(`Catching error: ${err}`);
    }
  });

  /**
   * `startHeartbeat` function that starts checking the client is connected.
   */
  function startHeartbeat() {
    pingPongId = setTimeout(sendHeartbeat, 5000);
    autoDiscId = setTimeout(autoDisconnect, 6000);
  }

  /**
   * `initRemainder` function that initialize the remainder of the "join project" event.
   * @param {String} proId the project id
   */
  async function initRemainder(username, project) {
    await Project.updateOne(
      {
        pid: project.pid,
      },
      {
        $set: {
          enable_time: Date.now(),
        },
      },
      (err, res) => {
        if (err) throw err;
        return res;
      }
    );

    let allComment = await Comment.find(
      { pid: project.pid },
      { file: 1, line: 1, description: 1, _id: 0 },
      (err, res) => {
        if (err) throw err;
        return res;
      }
    ).sort({ line: 1 });

    for (let i in allComment) {
      comments.push({
        file: allComment[i].file,
        line: allComment[i].line,
        description: allComment[i].description,
      });
    }

    client.emit("init state", {
      editor: await redis.hget(
        `project:${project.pid}`,
        "editor",
        (err, res) => res
      ),
    });
    client.emit("auto update score");
    client.emit("init reviews", comments);

    /**
     * Assign role to user.
     */
    io.in(projectId).emit("update role", {
      roles: projects[project.pid].roles,
      connected: username,
    });
  }

  /**
   * `createProjectNotification` function that create the project notification.
   * @param {Object} project project instance
   * @param {String} curUser the current user
   */
  async function createProjectNotification(curUser, project) {
    const role = curUser !== project.creator ? `creator` : `collaborator`;
    const partner =
      curUser !== project.creator ? project.creator : project.collaborator;

    let notifications = new Notification();
    notifications.receiver = [
      { username: curUser, status: `interacted` },
      { username: partner, status: `no interact` },
    ];
    notifications.link = `/project/${project.pid}/section/${cryptr.encrypt(
      sectionId
    )}/role/${role}`;
    notifications.head = `Project: ${project.title}`;
    notifications.content = `${project.description}`;
    notifications.status = `pending`;
    notifications.type = `project`;
    notifications.createdBy = curUser;
    notifications.info = { pid: project.pid };
    notifications = await notifications.save();
  }

  client.on("initialize the project session", () => {
    initializeProjectSession(curUser, projectId, 0);
  });

  client.on("clear interval", (name) => {
    if (name === `countdowntimer`) {
      clearInterval(timerId[`${projectId}countdowntimer`]);
    } else if (name === `dwellingtimer`) {
      clearInterval(timerId[`${projectSessionId}dwellingtimer`]);
    }
    clearInterval(timerId[`codertimer`]);
    clearInterval(timerId[`reviewertimer`]);
  });

  /**
   * `disconnect` event fired when user exit from playground page
   * by exit means: reload page, close page/browser, session lost
   **/
  client.on("disconnect", async () => {
    try {
      if (projects[projectId] !== undefined) {
        if (projects[projectId].kickOff) {
          if (projects[projectId].kickOff > 1) projects[projectId].kickOff -= 1;
          else delete projects[projectId].kickOff;
          client.leave(projectId);
        } else {
          clearInterval(timerId[`${projectId}countdowntimer`]);
          clearInterval(timerId[`${projectSessionId}dwellingtimer`]);
          clearInterval(timerId[`codertimer`]);
          clearInterval(timerId[`reviewertimer`]);
          /**
           * `countdownTimer()` function is started by only one user.
           **/
          io.in(projectId).emit("clear interval", `countdowntimer`);
          /**
           * Clear "dwellingtimer" interval's any user who hasn't left the project at the moment.
           */
          io.in(projectId).emit("clear interval", `dwellingtimer`);

          delete projects[projectId].activeUsers[curUser];

          let numUser = Object.keys(projects[projectId].activeUsers).length;

          /**
           * Leave the project at a certain time.
           */
          client.leave(projectId);
          clearTimeout(pingPongId);
          clearTimeout(autoDiscId);

          if (numUser >= 1) {
            if (curUser === projects[projectId].roles.coder) {
              projects[projectId].roles = swapRole(projects[projectId].roles);
            }
            io.in(projectId).emit("auto role change", {
              roles: projects[projectId].roles,
              status: `disconnected`,
            });
            io.in(projectId).emit("update status", {
              status: 0,
            });
            // clearInterval(timerId[`${projectSessionId}dwellingtimer`]);
            io.in(projectId).emit("start the project session", {});
          } else {
            delete projects[projectId];
          }

          await Project.updateOne(
            {
              pid: projectId,
            },
            {
              $set: {
                disable_time: Date.now(),
              },
            },
            (err, res) => {
              if (err) throw err;
              return res;
            }
          );

          const queryNotifications = await Notification.find(
            {
              $and: [
                { "receiver.username": curUser },
                { "receiver.status": `no interact` },
                { type: `project` },
              ],
            },
            {
              nid: 1,
            }
          ).sort({ createdAt: -1 });

          const notificationsId = [];
          for (let index in queryNotifications) {
            notificationsId.push(queryNotifications[index].nid);
          }

          if (notificationsId.length) {
            await Notification.updateMany(
              { nid: { $in: notificationsId } },
              { $set: { "receiver.$[].status": `interacted` } }
            );

            const reversedNotificationsId = [];
            for (let index in notificationsId) {
              let nid = notificationsId[index];
              let reversedNid = ``;
              for (let indexId = nid.length - 1; indexId >= 0; indexId--) {
                reversedNid += nid[indexId];
              }
              reversedNotificationsId.push(reversedNid);
            }

            if (
              reversedNotificationsId.length &&
              keyStores[sectionId] !== undefined
            ) {
              let guest = Object.keys(keyStores[sectionId]).find(
                (username) => keyStores[sectionId][username].guest === curUser
              );

              if (keyStores[sectionId][curUser] !== undefined || guest) {
                let tmpTimerId = Object.keys(timerIds).length + 1;

                timerIds[tmpTimerId] = setInterval(() => {
                  let pnSessionKey =
                    guest === undefined
                      ? curUser + sectionId
                      : guest + sectionId;

                  io.in(pnSessionKey).emit("disable project notification", {
                    reversedNotificationsId: reversedNotificationsId,
                    timerId: tmpTimerId,
                  });
                }, 5000);
              }
            }
          }
        }
      }
    } catch (err) {
      winston.error(`Catching error: ${err}`);
    }
  });

  /**
   * set review to mongoDB
   **/
  client.on("submit review", (payload) => {
    var found = false;

    /**
     * if there's not comment in array => add to DB and array
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
            line: payload.line,
          })
            .remove()
            .exec();
          comments.splice(index, 1);
        } else {
          Comment.updateOne(
            {
              file: payload.file,
              pid: projectId,
              line: payload.line,
            },
            {
              $set: {
                description: payload.description,
              },
            },
            (err) => {
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

  client.on("delete review", (payload) => {
    Comment.findOne({
      file: payload.file,
      pid: projectId,
      line: payload.line,
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
      deleteline: payload.line,
    });
  });

  /**
   * move hilight when enter or delete
   **/
  client.on("move hilight", (payload) => {
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
          Comment.updateOne(
            {
              file: fileName,
              pid: projectId,
              description: comments[i].description,
            },
            {
              $set: {
                line: comments[i].line,
              },
            },
            (err) => {
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
          Comment.updateOne(
            {
              file: fileName,
              pid: projectId,
              description: comments[i].description,
            },
            {
              $set: {
                line: comments[i].line,
              },
            },
            (err) => {
              if (err) throw err;
            }
          );
        }
      }
    }
  });

  /**
   * `create file` event fired when user click create new file
   * @param {Ibject} payload fileName
   **/
  client.on("create file", (payload) => {
    /**
     * save file name to mongoDB
     **/
    Project.updateOne(
      {
        pid: projectId,
      },
      {
        $push: {
          files: payload,
        },
      },
      (err) => {
        if (err) throw err;
      }
    );

    /**
     * create new file  ./public/project_files/projectId/fileName.py
     **/
    fs.open(
      "./public/project_files/" + projectId + "/" + payload + ".py",
      "w",
      function (err, file) {
        if (err) throw err;
      }
    );

    io.in(projectId).emit("update tab", {
      fileName: payload,
      action: "create",
    });
  });

  /**
   * `delete file` event fired when user click delete file
   * @param {Ibject} payload fileName
   **/
  client.on("delete file", async (payload) => {
    /**
     * delete file in mongoDB
     **/
    Project.updateOne(
      {
        pid: projectId,
      },
      {
        $pull: {
          files: payload,
        },
      },
      (err) => {
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
      function (err) {
        if (err) console.error(err);
      }
    );

    io.in(projectId).emit("update tab", {
      fileName: payload,
      action: "delete",
    });
  });

  /**
   * `role selected` event fired when one of the project user select his role
   * @param {Object} payload user selected role and partner username
   * then socket will broadcast the role to his partner
   **/
  client.on("role selected", (payload) => {
    countdownTimer();
    if (payload.select === 0) {
      projects[projectId].roles.reviewer = curUser;
      projects[projectId].roles.coder = payload.partner;
    } else {
      projects[projectId].roles.reviewer = payload.partner;
      projects[projectId].roles.coder = curUser;
    }
    Project.findOne({ pid: projectId }, function (err, res) {
      if (err) return handleError(err);
      io.in(projectId).emit("update role", {
        roles: projects[projectId].roles,
        project: res,
      });
    });
  });

  /**
   * The `switch role` event have 2 cases of this events as follows:
   * 1. the event fired when the one of users want to switch his role.
   * 2. The one of users leave the project session at a certain time.
   * @param {Object} payload contain `requestedBy` var,
   * @param {String} requestedBy the username of user requesting to switch role.
   */
  client.on("switch role", (payload) => {
    let numUser = Object.keys(projects[projectId].activeUsers).length;
    try {
      if (numUser >= 2 && payload.requestedBy !== "disconnected") {
        const roles = swapRole(projects[projectId].roles);
        io.in(projectId).emit(
          "manually switch role",
          roles,
          payload.requestedBy
        );
      } else {
        io.in(projectId).emit("update role", {
          roles: projects[projectId].roles,
        });
      }
    } catch (err) {
      console.error(`Catching error: ${err}`);
    }
  });

  /**
   * `confirm to switch role` event fired when `switch role` event occured.
   * @param {String} answer The confirmation for changing role.
   * @param {Object} roles The roles instance contain coder, reviewer and requestedBy.
   */
  client.on("confirm to switch role", (answer, roles) => {
    try {
      if (answer === "accept") {
        delete roles.requestedBy;
        projects[projectId].roles = roles;
        /**
         * The switch role request is accepted.
         */
        countdownTimer();
        io.in(projectId).emit("role timer");
        io.in(projectId).emit("update role", {
          roles: projects[projectId].roles,
        });
      } else {
        io.in(projectId).emit("update role", {
          roles: null,
          requestedBy: roles.requestedBy,
        });
      }
    } catch (err) {
      console.error(`Catching error: ${err}`);
    }
  });

  /**
   *
   */
  client.on("role timer started", () => {
    verifyRoles();
  });

  /**
   * `code change` event fired when user typing in editor
   * @param {Object} payload receive code from client payload
   **/
  client.on("code change", (payload) => {
    const origin = !!payload.code.origin && payload.code.origin !== "setValue";
    /**
     * origin mustn't be an `undefined` or `setValue` type
     **/
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(projectId).emit("editor update", payload.code);
      editorName = payload.fileName;
      redis.hgetall(`project:${projectId}`, function (err, obj) {
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
            /**
             * select some text and add input
             **/
            if (removeText.length == 1) {
              /**
               *  select text in 1 line
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
                ch: { $gte: fromCh },
              },
              { line: 1, ch: 1, text: 1, _id: 0 },
              function (err, res) {
                if (err) return handleError(err);
                var textInLine = res;
                for (var i = 0; i < textInLine.length; i++) {
                  History.updateOne(
                    {
                      pid: projectId,
                      file: fileName,
                      line: textInLine[i].line,
                      ch: textInLine[i].ch,
                      text: textInLine[i].text,
                    },
                    {
                      $set: {
                        line: fromLine,
                        ch: fromCh + i + 1,
                      },
                    },
                    (err) => {
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
            createdAt: Date.now(),
          };
          new History(historyModel, (err) => {
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
              ch: { $gte: fromCh },
            },
            { line: 1, ch: 1, text: 1, _id: 0 },
            function (err, res) {
              if (err) return handleError(err);
              let textInLine = res;
              for (let i = 0; i < textInLine.length; i++) {
                History.updateOne(
                  {
                    pid: projectId,
                    file: fileName,
                    line: textInLine[i].line,
                    ch: textInLine[i].ch,
                    text: textInLine[i].text,
                  },
                  {
                    $set: {
                      line: fromLine + 1,
                      ch: i,
                    },
                  },
                  (err) => {
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
            function (err, res) {
              if (err) return handleError(err);
              var textInLine = res;
              for (var i = 0; i < textInLine.length; i++) {
                History.updateOne(
                  {
                    pid: projectId,
                    file: fileName,
                    line: textInLine[i].line,
                    ch: textInLine[i].ch,
                    text: textInLine[i].text,
                  },
                  {
                    $set: {
                      line: textInLine[i].line + 1,
                    },
                  },
                  (err) => {
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
  client.on("run code", (payload) => {
    let code = payload.code;
    Object.keys(code).forEach(function (key) {
      fs.writeFile(
        "./public/project_files/" + projectId + "/" + key + ".py",
        code[key],
        (err) => {
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

    pythonProcess.on("data", (data) => {
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
        Score.where({ pid: projectId, uid: payload.uid }).findOne(function (
          err,
          score
        ) {
          if (err);
          if (score) {
            Score.updateOne(
              {
                pid: projectId,
                uid: payload.uid,
              },
              {
                $set: {
                  error_count: parseInt(score.error_count) + 1,
                },
              },
              (err) => {
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
  client.on("typing input on term", (payload) => {
    let inputTerm = payload.inputTerm;
    detectInput = inputTerm;
    if (pythonProcess !== undefined) {
      pythonProcess.write(inputTerm + "\r");
    }
  });

  /**
   * `pause running code` event fired when user click on pause button from front-end
   * @param {Object} payload code from editor
   */
  client.on("pause run code", (payload) => {
    if (pythonProcess != undefined) {
      setTimeout(pythonProcess.kill.bind(pythonProcess), 0);
    }
    io.in(projectId).emit("pause run code");
  });

  /**
   * `send message` event fired when user send chat message from front-end
   * @param {Object} payload code from editor
   */
  client.on("send message", (payload) => {
    const message = payload.message;
    const uid = payload.uid;
    const messageModel = {
      pid: projectId,
      uid: uid,
      message: message,
      createdAt: Date.now(),
    };
    new Message(messageModel, (err) => {
      if (err) throw err;
    }).save();
    User.where({ _id: uid }).findOne(function (err, user) {
      if (err) throw err;
      if (user) {
        const response = {
          user: user,
          message: messageModel,
        };
        io.in(projectId).emit("update message", response);
      }
    });
  });

  /**
   * `send active tab` event fired when user change tab
   * @param {Object} payload active tab
   */
  client.on("send active tab", (payload) => {
    io.in(projectId).emit("show partner active tab", payload);
  });

  client.on("open tab", async (payload) => {
    let fileName = payload;
    var code = await redis.hget(
      `project:${projectId}`,
      "editor",
      (err, ret) => ret
    );
    io.in(projectId).emit("set editor open tab", {
      fileName: fileName,
      editor: code,
    });
  });

  client.on("is typing", (payload) => {
    io.in(projectId).emit("is typing", payload);
  });

  /**
   * `reviewer active time` event fired reviewer active time every 1 sec
   * @param {Object} payload time from face detection on main.js
   */
  client.on("reviewer active time", (payload) => {
    io.in(projectId).emit("show reviewer active time", payload);
  });

  client.on("save active time", async (payload) => {
    const score = await Score.findOne({
      pid: projectId,
      uid: payload.uid,
    });

    await Score.updateOne(
      {
        pid: projectId,
        uid: payload.uid,
      },
      {
        $set: {
          time: parseInt(score.time) + parseInt(payload.time),
        },
      }
    );

    const user = await User.findOne({
      _id: payload.uid,
    });

    await User.updateOne(
      {
        _id: payload.uid,
      },
      {
        $set: {
          totalTime: parseInt(user.totalTime) + parseInt(payload.time),
        },
      }
    );

    ProjectSession.updateOne(
      { psid: projectSessionId },
      { $inc: { activeTime: payload.time } },
      (err, res) => {
        if (err) console.error(`Catching error: ${err}`);
        console.log(`Updating PrjtSsss --> activeTime: `, res);
      }
    );
  });

  client.on("save lines of code", (payload) => {
    History.aggregate([
      { $match: { user: curUser, pid: projectId } },
      { $group: { _id: { file: "$file", line: "$line" } } },
    ]).then(function (res) {
      Score.where({ pid: projectId, uid: payload.uid }).findOne(function (
        err,
        score
      ) {
        if (err);
        if (score) {
          Score.updateOne(
            {
              pid: projectId,
              uid: payload.uid,
            },
            {
              $set: {
                lines_of_code: parseInt(res.length),
              },
            },
            (err) => {
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
  client.on("submit code", (payload) => {
    const mode = payload.mode;
    const code = payload.code;

    /**
     * Check python files not empty at line 695 - 707
     **/
    let splitCode = "";
    let joinCode = "";
    let empty = true;
    let countError = 0;
    let countFile = 0;

    for (let key in code) {
      countFile++;
      let element_ = code[key];
      splitCode = element_.split("\n");
      joinCode = splitCode.join("");
      splitCode = joinCode.split(" ");
      joinCode = splitCode.join("");

      if (joinCode != "") {
        empty = false;
      } else {
        countError++;
      }
    }

    let pylintProcess;
    let args = ["-j", "1"];

    Object.keys(code).forEach(function (key) {
      args.push("./public/project_files/" + projectId + "/" + key + ".py");
      fs.writeFile(
        "./public/project_files/" + projectId + "/" + key + ".py",
        code[key],
        (err) => {
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
    pylintProcess.on("data", (data) => {
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
      //   score = 0
      // }
      data = data.replace(/\/10/g, "/100.00");

      /**
       * As the listener may send data three times per one process or more,
       * so the score of project must to save once.
       * The line of process is 757 to 903
       **/
      if (
        (!empty &&
          score == 0 &&
          data.indexOf("(syntax-error)") != -1 &&
          countError == 0 &&
          countFile == 1) ||
        (!empty && data.indexOf("Your code has been rated at") != -1) ||
        (empty && score == 0 && data.indexOf("public\\project_files\\") == -1)
      ) {
        if (data.indexOf("(syntax-error)") != -1) {
          countError++;
        }
        Project.where({ pid: projectId }).findOne(function (err, project) {
          if (err);
          if (project) {
            if (project.creator_id != null && project.collaborator_id != null) {
              const users = [project.creator_id, project.collaborator_id];
              users.forEach(function (element) {
                const scoreModel = {
                  pid: projectId,
                  uid: element,
                  score: score,
                  time: 0,
                  lines_of_code: 0,
                  error_count: 0,
                  participation: {
                    enter: [new Date()],
                    pairing: [new Date()],
                  },
                  createdAt: Date.now(),
                };
                Score.where({ pid: projectId, uid: element }).findOne(function (
                  err,
                  oldScore
                ) {
                  if (err) throw err;
                  if (!oldScore) {
                    new Score(scoreModel, (err) => {
                      if (err) throw err;
                    }).save();

                    /**
                     * recalculate score
                     **/
                    sumScore = Score.aggregate(
                      [
                        {
                          $match: {
                            uid: element,
                          },
                        },
                        {
                          $group: {
                            _id: "$uid",
                            avg: { $avg: "$score" },
                          },
                        },
                      ],
                      function (err, results) {
                        if (err) {
                          console.error(err);
                          return;
                        }
                        if (results) {
                          results.forEach(function (result) {
                            /**
                             * start update
                             **/
                            User.updateOne(
                              {
                                _id: element,
                              },
                              {
                                $set: {
                                  avgScore: result.avg,
                                },
                              },
                              function (err, userReturn) {
                                if (err) console.error(err);
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
                              avgScore: result.avg,
                            };
                            if (mode == "auto") {
                              client.emit("show auto update score", shownScore);
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
                    Score.updateOne(
                      {
                        pid: projectId,
                        uid: element,
                      },
                      {
                        $set: {
                          score: score,
                        },
                      },
                      async function (err, scoreReturn) {
                        if (err) throw err;
                        if (scoreReturn) {
                          /**
                           * recalculate score
                           **/
                          sumScore = await Score.aggregate(
                            [
                              {
                                $match: {
                                  uid: element,
                                },
                              },
                              {
                                $group: {
                                  _id: "$uid",
                                  avg: { $avg: "$score" },
                                },
                              },
                            ],
                            function (err, results) {
                              if (err) {
                                console.error(err);
                                return;
                              }
                              if (results) {
                                results.forEach(function (result) {
                                  /**
                                   * start update
                                   **/
                                  User.updateOne(
                                    {
                                      _id: element,
                                    },
                                    {
                                      $set: {
                                        avgScore: result.avg,
                                      },
                                    },
                                    function (err, userReturn) {
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
                                    avgScore: result.avg,
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
                      }
                    );
                  }
                });
              }, this);
            }
          }
        });
      }
      if (data.indexOf(".pylintrc") == -1 && data.indexOf("U") != 16) {
        client.emit("term update", data);
      }
    });
  });

  client.on("export file", (payload) => {
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
        (err) => {
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
        zlib: { level: 9 },
      });

      archive.on("error", function (err) {
        throw err;
      });
      /**
       * pipe archive data to the output file
       **/
      archive.pipe(output);
      /**
       * append files
       **/
      fileNameList.forEach(function (fileName) {
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
      filePath: cryptr.encrypt(filePath),
    });
  });

  /**
   * CoderTime interval
   */
  function coderTimeInterval() {
    ProjectSession.updateOne(
      { psid: projectSessionId },
      { $inc: { coderTime: 1000 } },
      (err, res) => {
        if (err) console.error(`Catching error: ${err}`);
        console.log(`Updating PrjtSsss --> coderTime: `, res);
      }
    );
  }

  /**
   * ReviewerTime interval
   */
  function reviewerTimeInterval() {
    ProjectSession.updateOne(
      { psid: projectSessionId },
      { $inc: { reviewerTime: 1000 } },
      (err, res) => {
        if (err) console.error(`Catching error: ${err}`);
        console.log(`Updating PrjtSsss --> reviewerTime: `, res);
      }
    );
  }

  /**
   * Verify curUser in the roles
   */
  function verifyRoles() {
    if (projects[projectId].roles.coder === curUser) {
      console.log(
        "CodeBuddy: projects[projectId].roles.coder",
        projects[projectId].roles.coder
      );
      clearInterval(timerId[`reviewertimer`]);
      timerId[`codertimer`] = setInterval(coderTimeInterval, 1000);
    } else if (projects[projectId].roles.reviewer === curUser) {
      console.log(
        "CodeBuddy: projects[projectId].roles.reviewer",
        projects[projectId].roles.reviewer
      );
      clearInterval(timerId[`codertimer`]);
      timerId[`reviewertimer`] = setInterval(reviewerTimeInterval, 1000);
    }
  }

  /**
   * This function is started by first only user.
   */
  function countdownTimer() {
    /**
     * Countdown interval
     */
    function intervalFunc() {
      redis.hgetall(`project:${projectId}`, function (err, obj) {
        var start = new Date(parseInt(obj.startTime));
        let minutes = moment
          .duration(swaptime - (Date.now() - start))
          .minutes();
        let seconds = moment
          .duration(swaptime - (Date.now() - start))
          .seconds();
        io.in(projectId).emit("countdown", {
          minutes: minutes,
          seconds: seconds,
        });
        if (minutes <= 0 && seconds <= 0) {
          io.in(projectId).emit("auto update score");

          projects[projectId].roles = swapRole(projects[projectId].roles);
          io.in(projectId).emit("update role", {
            roles: projects[projectId].roles,
          });
          countdownTimer();
          io.in(projectId).emit("role timer");
        }
      });
    }
    let query = Project.where({ pid: projectId });
    let swaptime = query.findOne(function (err, project) {
      if (err) return 300000;
      if (project) {
        return (swaptime = parseInt(project.swaptime) * 60 * 1000);
      }
    });
    if (timerId[`${projectId}countdowntimer`] === undefined) {
      timerId[`${projectId}countdowntimer`] = setInterval(intervalFunc, 1000);
      redis.hset(`project:${projectId}`, "startTime", Date.now().toString());
      return;
    } else {
      clearInterval(timerId[`${projectId}countdowntimer`]);
      delete timerId[`${projectId}countdowntimer`];
      countdownTimer();
      return;
    }
  }

  /**
   *
   * @param {*}
   */
  async function initializeProjectSession(username, pid, count) {
    if (projects[projectId].activeUsers[username]) {
      if (projectSessionId === "") {
        try {
          const numUser = Object.keys(projects[projectId].activeUsers).length;
          console.log(
            `The Project Session of ${username} is initialized. There's ${numUser} users.`
          );

          const user = await User.findOne(
            { username: username },
            (err, res) => {
              if (err) throw err;
              return res;
            }
          );

          // const project = await Project.findOne({ pid: pid }, (err, res) => {
          //   if (err) throw err;
          //   return res;
          // });

          const projectSessions = await new ProjectSession(
            {
              uid: user._id,
              pid: pid,
              noOfActiveUser: numUser,
            },
            (err, res) => {
              if (err) throw err;
              return res;
            }
          ).save();
          projectSessionId = projectSessions.psid;

          dwellingTimer(projectSessionId);
        } catch (err) {
          console.error(`Catching error: ${err}`);
        }
        return;
      } else {
        if (count === 5) {
          return;
        }
        console.log(`Initialize Project Session, ${count}`);
        count += 1;
        clearInterval(timerId[`${projectSessionId}dwellingtimer`]);
        projectSessionId = "";
        initializeProjectSession(username, pid, count);
        return;
      }
    }
  }

  /**
   *
   * @param {*}
   */
  function completeProjectSession() {}

  /**
   *
   * @param {*} user
   * @param {*} project
   */
  function dwellingTimer(psid) {
    timerId[`${psid}dwellingtimer`] = setInterval(() => {
      // console.log(`${curUser} Dwelling Timer of ${psid}: ${1000}`);
      ProjectSession.updateOne(
        {
          psid: psid,
        },
        {
          $inc: { dwellingTime: 1000 },
        },
        (err) => {
          if (err) console.error(`Catching error: ${err}`);
        }
      );
    }, 1000);
  }

  function swapRole(roles) {
    const tempRoles = {
      coder: "",
      reviewer: "",
    };
    tempRoles.coder = roles.reviewer;
    tempRoles.reviewer = roles.coder;
    return tempRoles;
  }

  function saveComment(payload) {
    const commentModel = {
      file: payload.file,
      line: parseInt(payload.line),
      pid: projectId,
      description: payload.description,
      createdAt: Date.now(),
    };
    new Comment(commentModel, (err) => {
      if (err) throw err;
    }).save();
    comments.push({
      file: payload.file,
      line: parseInt(payload.line),
      description: payload.description,
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

  function deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh) {
    History.find({
      pid: projectId,
      file: fileName,
      line: fromLine,
      ch: { $gte: fromCh, $lt: toCh },
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
    let lineRange = toLine - fromLine;
    for (let i = fromLine; i <= fromLine + lineRange; i++) {
      /**
       * first line
       **/
      if (i == fromLine) {
        let resHis = History.findOne({
          pid: projectId,
          file: fileName,
          line: i,
          ch: { $gte: fromCh },
        });

        History.findOne({
          pid: projectId,
          file: fileName,
          line: i,
          ch: { $gte: fromCh },
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
          line: i,
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
          ch: { $lt: toCh },
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
      function (err, res) {
        if (err) return handleError(err);
        let textInLine = res;
        for (let i = 0; i < textInLine.length; i++) {
          History.updateOne(
            {
              pid: projectId,
              file: fileName,
              line: textInLine[i].line,
              ch: textInLine[i].ch,
              text: textInLine[i].text,
            },
            {
              $set: {
                line: fromLine,
                ch: fromCh + i,
              },
            },
            (err) => {
              if (err) throw err;
            }
          );
        }
      }
    );
  }
};
