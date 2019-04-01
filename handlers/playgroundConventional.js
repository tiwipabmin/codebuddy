const winston = require('winston')
const mongoose = require('mongoose')
const moment = require('moment')
const fs = require('fs');
const archiver = require('archiver');
const nodepty = require('node-pty')

const Project = mongoose.model('Project')
const Message = mongoose.model('Message')
const Score = mongoose.model('Score')
const User = mongoose.model('User')
const Comment = mongoose.model('Comment')
const History = mongoose.model('History')

module.exports = (io, client, redis, projects) => {
  // recieve project id from client and stored in projectId
  let projectId = ''
  let curUser = ''
  var comments = []
  var index = null
  let pythonProcess

  winston.info('Client connected')

  /**
   * `join project` evnet trigged when user joining project in playground page
   * @param {Object} payload receive project id from client payload
   * after that socket will fire `init state` with editor code to initiate local editor
   */
  client.on('join project', async (payload) => {
    try {
      projectId = payload.pid
      curUser = payload.username
      winston.info(`User ${payload.username} joined at pid: ${payload.pid}`)
      client.join(projectId)

      var allcomment = await Comment
        .find({pid: payload.pid}, {file:1, line:1, description:1, _id:0})
        .sort({ line: 1 })

      for (var i in allcomment) {
        comments.push({
          file: allcomment[i].file,
          line: allcomment[i].line,
          description: allcomment[i].description})
      }

      Project.update({
        pid: projectId
      }, {
        $set: {
          createdAt: Date.now()
        }
      }, (err) => {
        if (err) throw err
      })

      // Checking if this project hasn't have any roles assigned.
      if (!projects[projectId]) {
        winston.info(`created new projects['${projectId}']`)
        projects[projectId] = {
          roles: {
            coder: '',
            reviewer: '',
            reviews: []
          },
          count: 1
        }
        winston.info(projects[projectId].count)
        client.emit('role selection')
      } else {
        Project.findOne({ pid: projectId}, function (err, res) {
          if (err) return handleError(err);
          projects[projectId].count += 1
          winston.info(projects[projectId].count)
          client.emit('role updated', { projectRoles: projects[projectId], project: res})
        })
      }

      client.emit('init state', {
        editor: await redis.hget(`project:${projectId}`, 'editor', (err, ret) => ret)
      })

      io.in(projectId).emit('auto update score')

      client.emit('init reviews', comments)
    } catch (error) {
      winston.info(`catching error: ${error}`)
    }
  })

  /**
   * `disconnect` event fired when user exit from playground page
   * by exit means: reload page, close page/browser, session lost
   */
  client.on('disconnect', () => {
    try {
      projects[projectId].count -= 1
      winston.info(`user left project ${projectId} now has ${projects[projectId].count} user(s) online`)
      if (projects[projectId].count === 0) {
        delete projects[projectId]
      }
      client.leave(projectId)
      winston.info('Client disconnected')
    } catch (error) {
      winston.info(`catching error: ${error}`)
    }
  })

  //set review to mongoDB
  client.on('submit review', (payload) => {
    var found = false

    //if there's no comment in array => add to DB and array
    if (comments.length==0) {
      saveComment(payload)
    } else {
      //edit comment in exist line => update in DB
      for (var i in comments) {
        if (comments[i].line==payload.line  && comments[i].file == payload.file) {
          found = true
          index = i
        }
      }
      if (found) {
        if (payload.description=='') {
          Comment.findOne({
            file: payload.file,
            pid:  projectId,
            line: payload.line
          }).remove().exec()
          comments.splice(index,1)
        } else {
          Comment.update({
            file: payload.file,
            pid: projectId,
            line: payload.line
          }, {
            $set: {
              description: payload.description
            }
          }, (err) => {
            if (err) throw err
          })
          updateDesc(payload.file, payload.line, payload.description);
        }
      } else {
        saveComment(payload)
      }
    }
    io.in(projectId).emit('new review', comments)
  })

  client.on('delete review', (payload) => {
    Comment.findOne({
      file: payload.file,
      pid:  projectId,
      line: payload.line
    }).remove().exec()
    //remove deleted comment from list
    for (var i in comments) {
      if ((comments[i].file == payload.file) && (comments[i].line==payload.line)) {
        comments.splice(i, 1)
        break
      }
    }

    io.in(projectId).emit('update after delete review', {
      comments: comments,
      file: payload.file,
      deleteline: payload.line})
  })

  //move hilight when enter or delete
  client.on('move hilight', (payload) => {
    var fileName = payload.fileName
    var enterline = payload.enterline
    var remove = payload.remove
    var oldline = payload.oldline
    var isEnter = payload.isEnter
    var isDelete = payload.isDelete
    comments = payload.comments

    //check when enter new line
    if (isEnter) {
      for (var i in comments) {
        if ((comments[i].line > enterline) && (comments[i].file == fileName)) {
          Comment.update({
            file: fileName,
            pid: projectId,
            description: comments[i].description
          }, {
            $set: {
              line: comments[i].line
            }
          }, (err) => {
            if (err) throw err
          })
        }
      }
    }

    //check when delete line
    if (isDelete) {
      for (var i in comments) {
        if ((comments[i].line > parseInt(enterline)-1) && (comments[i].file == fileName)) {
          Comment.update({
            file: fileName,
            pid: projectId,
            description: comments[i].description
          }, {
            $set: {
              line: comments[i].line
            }
          }, (err) => {
            if (err) throw err
          })
        }
      }
    }
  })

  /**
   * `create file` event fired when user click create new file
   * @param {Ibject} payload fileName
   */
  client.on('create file', (payload) => {
    //save file name to mongoDB
    Project.update({
      pid: projectId
    }, {
      $push: {
        files: payload
      }
    }, (err) => {
      if (err) throw err
    })

    //create new file  ./public/project_files/projectId/fileName.py
    fs.open('./public/project_files/'+projectId+'/'+payload+'.py', 'w', function (err, file) {
      if (err) throw err
      console.log('file '+payload+'.py is created');
    })

    io.in(projectId).emit('update tab', { fileName: payload, action: 'create' })
  })

  /**
   * `delete file` event fired when user click delete file
   * @param {Ibject} payload fileName
   */
  client.on('delete file', async (payload) => {
    //delete file in mongoDB
    Project.update({
      pid: projectId
    }, {
      $pull: {
        files: payload
      }
    }, (err) => {
      if (err) throw err
    })

    //delete code in redis
    var code = JSON.parse(await redis.hget(`project:${projectId}`, 'editor', (err, ret) => ret))
    if (code != null) {
      delete code[payload]
      redis.hset(`project:${projectId}`, 'editor', JSON.stringify(code))
    }

    // delete file
    fs.unlink('./public/project_files/'+projectId+'/'+payload+'.py', function (err) {
      if (err) throw err
      console.log(payload+'.py is deleted!');
    });

    io.in(projectId).emit('update tab', { fileName: payload, action: 'delete' })
  })

  /**
   * `role selected` event fired when one of the project user select his role
   * @param {Ibject} payload user selected role and partner username
   * then socket will broadcast the role to his partner
   */
  client.on('role selected', (payload) => {
    countdownTimer()
    if (payload.select === 0) {
      projects[projectId].roles.reviewer = curUser
      projects[projectId].roles.coder = payload.partner
    } else {
      projects[projectId].roles.reviewer = payload.partner
      projects[projectId].roles.coder = curUser
    }
    console.log(projects[projectId])
    Project.findOne({ pid: projectId}, function (err, res) {
      if (err) return handleError(err);
      io.in(projectId).emit('role updated', { projectRoles: projects[projectId], project: res })
    })
  })

  client.on('switch role', () => {
    switchRole()
  })

  /**
   * `code change` event fired when user typing in editor
   * @param {Object} payload receive code from client payload
   */
  client.on('code change', (payload) => {
    const origin = !!payload.code.origin && (payload.code.origin !== 'setValue')
    // origin mustn't be an `undefined` or `setValue` type
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(projectId).emit('editor update', payload.code)
      console.log(payload);
      console.log("code " + payload.code.text[0]);
      editorName = payload.fileName;
      redis.hgetall(`project:${projectId}`, function (err, obj) {
        var editorJson = {};
        if (obj.editor != undefined) {
          var editorJson = JSON.parse(obj.editor);
        }
        editorJson[editorName] = payload.editor;
        redis.hset(`project:${projectId}`, 'editor', JSON.stringify(editorJson))
      });
      // ------ history -----
      var enterText = payload.code.text
      var removeText = payload.code.removed
      var action = payload.code.origin
      var fromLine = payload.code.from.line
      var fromCh = payload.code.from.ch
      var toLine = payload.code.to.line
      var toCh = payload.code.to.ch
      var moreLine = false
      var fileName = payload.fileName

      console.log(removeText[0].length)

      for (var i=0; i<removeText.length; i++) {
        if (removeText[i].length) {
          moreLine = true
          break
        }
      }
      //save input text to mongoDB
      if (action=='+input') {
        console.log('>>>>>>save input')
        if (enterText.length==1) {
          //input ch
          if (removeText[0].length!=0) {
            //select some text and add input
            if (removeText.length==1) {
              //select text in 1 line
              console.log('>>>>>>delete in 1 line more than 1 text')
              deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh)
              updateTextAfter(projectId, fileName, fromLine, fromLine, fromCh+1, toCh)
            } else if ((removeText.length>1 && moreLine) || (removeText[0].length==0 && removeText[1].length==0)) {
              //select more than 1 line || delete line
              deleteMoreLine(projectId, fileName, toLine, fromLine, fromCh, toCh, action)
            }

          } else {
            //move right ch of cursor
            History.find({ pid: projectId , file: fileName, line: fromLine, ch: {$gte :fromCh}}, {line:1, ch:1, text:1, _id:0}, function (err, res) {
              if (err) return handleError(err);
              var textInLine = res
              console.log(res)
              for (var i=0; i<textInLine.length; i++) {
                console.log(textInLine[i])
                History.update({
                  pid: projectId,
                  file: fileName,
                  line: textInLine[i].line,
                  ch: textInLine[i].ch,
                  text: textInLine[i].text
                }, {
                  $set: {
                    line: fromLine,
                    ch: fromCh+i+1
                  }
                }, (err) => {
                  if (err) throw err
                })
              }
            })
          }

          //save ch to mongoDB
          const historyModel = {
            pid: projectId,
            file: fileName,
            line: fromLine,
            ch: fromCh,
            text: payload.code.text,
            user: payload.user,
            createdAt: Date.now()
          }
          new History(historyModel, (err) => {
              if (err) throw err
          }).save()
        } else if (enterText.length==2) {
          //enter new line
          //first line -> move right ch of cursor to new line
          if (removeText[0].length!=0) {
            //enter delete text
            deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh)
          }

          History.find({ pid: projectId , file: fileName, line: fromLine, ch: {$gte :fromCh}}, {line:1, ch:1, text:1, _id:0}, function (err, res) {
            if (err) return handleError(err);
            var textInLine = res
            console.log(res)

            for (var i=0; i<textInLine.length; i++) {
              History.update({
                pid: projectId,
                file: fileName,
                line: textInLine[i].line,
                ch: textInLine[i].ch,
                text: textInLine[i].text
              }, {
                $set: {
                  line: fromLine+1,
                  ch: i
                }
              }, (err) => {
                if (err) throw err
              })
            }
          })

          //not first line -> line+1
          History.find({ pid: projectId , file: fileName, line: {$gt: fromLine}}, {line:1, ch:1, text:1, _id:0}, function (err, res) {
            if (err) return handleError(err);
            var textInLine = res
            console.log(res)

            for (var i=0; i<textInLine.length; i++) {
              History.update({
                pid: projectId,
                file: fileName,
                line: textInLine[i].line,
                ch: textInLine[i].ch,
                text: textInLine[i].text
              }, {
                $set: {
                  line: textInLine[i].line+1
                }
              }, (err) => {
                if (err) throw err
              })
            }
          })
        }
      } else if (action=='+delete') {
        //delete text from mongoDB
        if (removeText.length==1) {
          //delete select text
          console.log('>>>>>>delete in 1 line more than 1 text')
          deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh)
          updateTextAfter(projectId, fileName, fromLine, fromLine, fromCh, toCh)
        } else if ((removeText.length>1 && moreLine) || (removeText[0].length==0 && removeText[1].length==0)) {
          //delete more than 1 line || delete line
          deleteMoreLine(projectId, fileName, toLine, fromLine, fromCh, toCh, action)
        }
      }
      // ------ end history -----
    }
  })

  /**
   * `user status` event fired every 3 seconds for checking user status
   * @param {Object} payload user status from client-side
   */
  client.on('user status', (payload) => {
    client.to(projectId).emit('update status', payload)
  })

  /**
   * `run code` event fired when user click on run button from front-end
   * @param {Object} payload code from editor
   */
  client.on('run code', (payload) => {
    var code = payload.code;
    Object.keys(code).forEach(function (key) {
      fs.writeFile('./public/project_files/'+projectId+'/'+key+'.py', code[key], (err) => {
        if (err) throw err
      })
    });

    if (process.platform === 'win32') {
      pythonProcess = nodepty.spawn('python.exe', ['./public/project_files/'+projectId+'/'+'main.py'], {})
    } else {
      pythonProcess = nodepty.spawn('python', ['./public/project_files/'+projectId+'/'+'main.py'], {})
    }

    pythonProcess.on('data', (data) => {
      // check is code error
      if (data.indexOf('Error') != -1 || data.indexOf('Traceback (most recent call last):') != -1) {
        console.log(curUser, 'makes error!')
        // increase error_count of user
        Score.where({ pid: projectId, uid: payload.uid}).findOne(function (err, score) {
          if (err);
          if (score) {
            Score.update({
              pid: projectId,
              uid: payload.uid
            }, {
              $set: {
                error_count: parseInt(score.error_count) + 1
              }
            }, (err) => {
                  if (err) throw err
            })
          }
        })
      }
      io.in(projectId).emit('term update', data)
    })

    setTimeout(pythonProcess.kill.bind(pythonProcess), 3000);
  })

  /**
   * `pause running code` event fired when user click on pause button from front-end
   * @param {Object} payload code from editor
   */
  client.on('pause run code', (payload) => {
    if (pythonProcess != undefined) {
      setTimeout(pythonProcess.kill.bind(pythonProcess), 0);
    }
    io.in(projectId).emit('pause run code')
  })

  /**
   * `send message` event fired when user send chat message from front-end
   * @param {Object} payload code from editor
   */
  client.on('send message', (payload) => {
    const message = payload.message
    const uid = payload.uid
    console.log(payload)
    const messageModel = {
      pid: projectId,
      uid: uid,
      message: message,
      createdAt: Date.now()
    }
    new Message(messageModel, (err) => {
      if (err) throw err
    }).save()
    User.where({ _id: uid}).findOne(function (err, user) {
      if (err) throw err
      if (user) {
        const response = {
          user: user,
          message: messageModel
        }
        io.in(projectId).emit('update message', response)
      }
    })
  })

  /**
   * `send active tab` event fired when user change tab
   * @param {Object} payload active tab
   */
  client.on('send active tab', (payload) => {
    io.in(projectId).emit('show partner active tab', payload)
  })

  client.on('open tab', async (payload) => {
    var fileName = payload
    var code = await redis.hget(`project:${projectId}`, 'editor', (err, ret) => ret)
    io.in(projectId).emit('set editor open tab', {fileName: fileName, editor: code})
  })

  client.on('is typing', (payload) => {
    io.in(projectId).emit('is typing', payload)
  })

  /**
   * `reviewer active time` event fired reviewer active time every 1 sec
   * @param {Object} payload time from face detection on main.js
   */
  client.on('reviewer active time', (payload) => {
    io.in(projectId).emit('show reviewer active time', payload);
  })

  client.on('save active time', async (payload) => {
    console.log(payload)
    console.log(projectId)

    const score = await Score.findOne({
      pid: projectId,
      uid: payload.uid
    })

    await Score.update({
      pid: projectId,
      uid: payload.uid
    }, {
      $set: {
        time: parseInt(score.time) + parseInt(payload.time)
      }
    })

    const user = await User.findOne({
      _id: payload.uid
    })

    await User.update({
      _id: payload.uid
    }, {
      $set: {
        totalTime: parseInt(user.totalTime) + parseInt(payload.time)
      }
    })

    console.log('time', payload.time);
  })

  client.on('save lines of code', (payload) => {
    History.aggregate([
      { $match: { user: curUser, pid: projectId } },
      { $group: { _id: { file: '$file', line: '$line' } } }
    ]).then(function (res) {
      console.log('save lines of code: ', res.length, res)
      Score.where({ pid: projectId, uid: payload.uid}).findOne(function (err, score) {
        if (err);
        if (score) {
          Score.update({
            pid: projectId,
            uid: payload.uid
          }, {
            $set: {
              lines_of_code: parseInt(res.length)
            }
          }, (err) => {
              if (err) throw err
          })
        }
      })
    });
  })

  /**
   * `submit code` event fired when user click on submit button from front-end
   * @param {Object} payload code from editor
   */
  client.on('submit code', (payload) => {
    console.log(payload.mode)
    const mode = payload.mode
    const uid = payload.uid
    const code = payload.code
    let pylintProcess;
    var args = ['-j', '4']

    Object.keys(code).forEach(function (key) {
      args.push('./public/project_files/'+projectId+'/'+key+'.py')
      fs.writeFile('./public/project_files/'+projectId+'/'+key+'.py', code[key], (err) => {
        if (err) throw err
      })
    });

    if (process.platform === 'win32') {
      pylintProcess = nodepty.spawn('pylint.exe', args, {})
    } else {
      pylintProcess = nodepty.spawn('pylint', args, {});
    }

    pylintProcess.on('data', (data) => {
      //get score from pylint
      const before_score = data.indexOf("Your code has been rated at");
      let score = 0;
      if (before_score != -1) {
        const after_score = data.indexOf("/10");
        score = data.slice(before_score + 28, after_score)
      } else if (data.indexOf('E:') < 0) {
        score = 0
      }
      data = data.replace(/\/10/g, "/100.00")
      Project.where({pid: projectId}).findOne(function (err, project) {
        if (err);
        if (project) {
          if (project.creator_id != null && project.collaborator_id != null) {
            const users = [project.creator_id, project.collaborator_id]
            users.forEach(function (element) {
              const scoreModel = {
                pid: projectId,
                uid: element,
                score: score,
                time: 0,
                lines_of_code: 0,
                error_count: 0,
                createdAt: Date.now()
              }
              Score.where({pid: projectId, uid: element}).findOne(function (err, oldScore) {
                if (err) throw err
                if (!oldScore) {
                  new Score(scoreModel, (err) => {
                    if (err) throw err
                  }).save()

                  // recalculate score
                  sumScore = Score.aggregate([
                    { $match:{
                        uid: element
                    }},
                    { $group: {
                        _id: '$uid',
                        avg: {$avg: '$score'}
                    }}
                  ], function (err, results) {
                      if (err) {
                          console.log(err)
                          return
                      }
                      if (results) {
                        // sum = 0;
                        results.forEach(function (result) {
                          // start update
                          User.update({
                            _id: element
                          }, {
                            $set: {
                              avgScore: result.avg
                            }
                          }, function (err, userReturn) {
                            if (err);
                            if (userReturn) {
                              console.log(userReturn)
                            }
                          });
                          // end update
                          const shownScore = {
                            score: score,
                            uid: element,
                            avgScore: result.avg
                          }
                          if (mode == "auto") {
                            io.in(projectId).emit('show auto update score', shownScore)
                          } else {
                            io.in(projectId).emit('show score', shownScore)
                            io.in(projectId).emit('show auto update score', shownScore)
                          }
                        })
                      }
                  });
                  // end recalculate score
                }
                if (oldScore) {
                  Score.update({
                    pid: projectId,
                    uid: element
                  }, {
                    $set: {
                      score: score
                    }
                  }, function (err, scoreReturn) {
                    if (err) throw err
                    if (scoreReturn) {
                      // recalculate score
                      sumScore = Score.aggregate([
                        { $match:{
                            uid: element
                        }},
                        { $group: {
                            _id: '$uid',
                            avg: {$avg: '$score'}
                        }}
                      ], function (err, results) {
                          if (err) {
                            console.log(err)
                            return
                          }
                          if (results) {
                            // sum = 0;
                            results.forEach(function (result) {
                              // start update
                              User.update({
                                _id: element
                              }, {
                                $set: {
                                  avgScore: result.avg
                                }
                              }, function (err, userReturn) {
                                if (err);
                                if (userReturn) {
                                  console.log(userReturn)
                                }
                              });
                              // end update
                              const shownScore = {
                                score: score,
                                uid: element,
                                avgScore: result.avg
                              }
                              if (mode == "auto") {
                                io.in(projectId).emit('show auto update score', shownScore)
                              } else {
                                io.in(projectId).emit('show score', shownScore)
                                io.in(projectId).emit('show auto update score', shownScore)
                              }
                            })
                          }
                      });
                      // end recalculate score
                    }
                  });
                }
              });
            }, this);
          }
        }
      });
      io.in(projectId).emit('term update', data)
    })
  })

  client.on('export file', (payload) => {
    var fileNameList = payload.fileNameList
    console.log(payload)
    var code = payload.code

    for (var i in fileNameList) {
      fs.writeFile('./public/project_files/'+projectId+'/'+fileNameList[i]+'.py', code[fileNameList[i]], (err) => {
        if (err) throw er
      })
    }


    var output = fs.createWriteStream('./public/project_files/'+projectId+'/'+projectId+'.zip');
    var archive = archiver('zip', {
        gzip: true,
        zlib: { level: 9 } // Sets the compression level.
    });
    archive.on('error', function (err) {
      throw err;
    });
    // pipe archive data to the output file
    archive.pipe(output);
    // append files
    fileNameList.forEach(function (fileName) {
      archive.file('./public/project_files/'+projectId+'/'+fileName+'.py', {name: fileName+'.py'});
    })
    archive.finalize();
    client.emit('download file', projectId )
   })

  function countdownTimer() {
      function intervalFunc() {
        redis.hgetall(`project:${projectId}`, function (err, obj) {
          var start = new Date(parseInt(obj.startTime))
          let minutes = moment.duration(swaptime - (Date.now() - start)).minutes();
          let seconds = moment.duration(swaptime - (Date.now() - start)).seconds();
          // console.log(seconds + "secound")
          flag = 0
          if (seconds == 0 && flag != 1) {
            flag = 1
            io.in(projectId).emit('auto update score')
          } else {
            flag = 0
          }
          io.in(projectId).emit('countdown', {minutes: minutes, seconds: seconds})
          if (minutes <= 0 && seconds <= 0) {
              clearInterval(timerId)
              switchRole()
          }
        });
      }
      var query  = Project.where({ pid: projectId });
      let swaptime = query.findOne(function (err, project) {
          if (err) return 300000;
          if (project) {
              return swaptime = parseInt(project.swaptime) * 60 * 1000
          }
      });
      let timerId = setInterval(intervalFunc, 1000);
      redis.hset(`project:${projectId}`, 'startTime', Date.now().toString())
  }

  function switchRole() {
    countdownTimer()
    console.log("project_id" + projectId);
    console.log(projects[projectId]);
    // Checking if this project hasn't have any roles assigned.
    if (!projects[projectId]) {
      winston.info(`created new projects['${projectId}'] - fix bug version`)
      projects[projectId] = {
        roles: {
          coder: '',
          reviewer: '',
          reviews: []
        },
        count: 1
      }
      winston.info(projects[projectId].count)
      client.emit('role selection')
    } else {
      const temp = projects[projectId].roles.coder
      projects[projectId].roles.coder = projects[projectId].roles.reviewer
      projects[projectId].roles.reviewer = temp
      Project.findOne({ pid: projectId}, function (err, res) {
        if (err) return handleError(err);
        io.in(projectId).emit('role updated', { projectRoles: projects[projectId], project: res})
      })
    }
  }

  function saveComment(payload) {
    const commentModel = {
      file: payload.file,
      line: parseInt(payload.line),
      pid: projectId,
      description: payload.description,
      createdAt: Date.now()
    }
    new Comment(commentModel, (err) => {
        if (err) throw err
    }).save()
    comments.push({
      file: payload.file,
      line: parseInt(payload.line),
      description: payload.description})
  }

  function updateDesc(file, line, description) {
    for (var i in comments) {
      if (comments[i].file == file && comments[i].line == line) {
         comments[i].description = description;
         break
      }
    }
  }

  function deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh) {
    History.find({
      pid:  projectId,
      file: fileName,
      line: fromLine,
      ch: {$gte : fromCh,
          $lt: toCh}
    }).remove().exec()
  }

  function deleteMoreLine(projectId, fileName, toLine, fromLine, fromCh, toCh, action) {
    var lineRange = toLine-fromLine
    console.log('>>>>delete line' + lineRange)
    for (var i=fromLine; i<=fromLine+lineRange; i++) {
      console.log('>---- '+ i)
      //first line
      if (i==fromLine) {
        console.log('   first line')
          History.findOne({
            pid: projectId,
            file: fileName,
            line: i,
            ch: {$gte : fromCh}
          }).remove().exec()
      }
      //not last line
      else if (i!=fromLine+lineRange) {
        console.log('   not first line')
        History.find({
          pid:  projectId,
          file: fileName,
          line: i
        }).remove().exec()
      }
      //last line
      else {
        console.log('   last line')
        History.find({
          pid:  projectId,
          file: fileName,
          line: i,
          ch: {$lt :toCh}
        }).remove().exec()

        if (action=='+input') {
          updateTextAfter(projectId, fileName, i, fromLine, fromCh+1, toCh)
        } else {
          updateTextAfter(projectId, fileName, i, fromLine, fromCh, toCh)
        }
      }
    }
  }

  function updateTextAfter(projectId, fileName, line, fromLine, fromCh, toCh) {
    History.find({ pid: projectId , file: fileName, line: line, ch: {$gte :toCh}}, {line:1, ch:1, text:1, _id:0}, function (err, res) {
      if (err) return handleError(err);
      var textInLine = res
      console.log(res)
      for (var i=0; i<textInLine.length; i++) {
        console.log(textInLine[i])
        History.update({
          pid: projectId,
          file: fileName,
          line: textInLine[i].line,
          ch: textInLine[i].ch,
          text: textInLine[i].text
        }, {
          $set: {
            line: fromLine,
            ch: fromCh+i
          }
        }, (err) => {
          if (err) throw err
        })
      }
    })
  }
}
