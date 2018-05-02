const socketio = require('socket.io')
const winston = require('winston')
const Redis = require('ioredis')
const mongoose = require('mongoose')
const timer = require('timers')
const moment = require('moment')
const fs = require('fs');

const Project = mongoose.model('Project')
const Message = mongoose.model('Message')
const Score = mongoose.model('Score')
const User = mongoose.model('User')
const Comment = mongoose.model('Comment')

/**
 * @param {Object} server server instance
 */
module.exports = (server) => {
  // Initiate socket.io conection
  const io = socketio(server)

  // Initiate redis connection for persist data
  const redis = new Redis()
  const projects = {} // store users role in each project

  // Event routing
  io.on('connection', (client) => {
    // recieve project id from client and stored in projectId
    let projectId = ''
    let curUser = ''
    let review = []
    var comments = []
    var index = null
    let pty;

    winston.info('Client connected')

    //set review to mongoDB
    client.on('submit review', (payload) => {
      var found = false     
      
      //if there's no comment in array => add to DB and array
      if (comments.length==0) {
        saveComment(payload)
      } else {
        //edit comment in exist line => update in DB
        for (var i=0; i<comments.length; i++) {
          if (comments[i].line==payload.line){ 
            found = true
            index = i
          }
        }
        if (found) {
          if (payload.description=='') {
            Comment.findOne({
              pid:  projectId,
              line: payload.line
            }).remove().exec()
            comments.splice(index,1)
          } else {
            Comment.update({
              pid: projectId,
              line: payload.line
            }, {
              $set: {
                description: payload.description
              } 
            }, (err) => {
              if (err) throw err
            })
            updateDesc(payload.line, payload.description);
          }
        } else {
          saveComment(payload)
        } 
      }
      io.in(projectId).emit('new review', comments)
    })

    client.on('delete review', (payload) => {
      Comment.findOne({
        pid:  projectId,
        line: payload.line
      }).remove().exec()

      deletecomments = comments.filter(function(el){
        return el.line !== parseInt(payload.line);
      })
      
      io.in(projectId).emit('update review', {
        comments: deletecomments,
        deleteline: payload.line})
    })

    //move hilight when enter or delete
    client.on('move hilight', (payload) => {
      var enterline = payload.enterline
      var remove = payload.remove
      var oldline = payload.oldline
      var isEnter = payload.isEnter
      var isDelete = payload.isDelete
      comments = payload.comments

      //check when enter new line
      if(isEnter){
        for(var i in comments){
          if(comments[i].line > enterline){        
            Comment.update({
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
      if(isDelete){
        for(var i in comments){
          if(comments[i].line > parseInt(enterline)-1){  
            Comment.update({
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

        comments = await Comment
          .find({pid: payload.pid}, {line:1, description:1, _id:0})
          .sort({ line: 1 })        

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
          projects[projectId].count += 1
          winston.info(projects[projectId].count)
          client.emit('role updated', projects[projectId])
        }

        client.emit('init state', {
          editor: await redis.hget(`project:${projectId}`, 'editor', (err, ret) => ret)
        })

        io.in(projectId).emit('auto update score')

        client.emit('init reviews', comments)

        //combine 2 files
        
        // file = 'pytest.py'
        // appendFile = 'main.py'
        // readAppend(file, appendFile)
        
        // appendFile = 'file2.py'
        // readAppend(file, appendFile)


      } catch (error) {
        winston.info(`catching error: ${error}`)
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

      //create new file  ./project_files/projectId/fileName.py
      fs.open('./project_files/'+projectId+'/'+payload+'.py', 'w', function (err, file) {
        if (err) throw err;
        console.log('file '+payload+'.py is created');
      })

      var action = 'create'
      io.in(projectId).emit('update tab', {fileName: payload, action: action})
    })

    /**
     * `delete file` event fired when user click delete file
     * @param {Ibject} payload fileName
     */

    client.on('delete file', (payload) => {
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

      // delete file
      fs.unlink('./project_files/'+projectId+'/'+payload+'.py', function (err) {
        if (err) throw err;
        console.log(payload+'.py is deleted!');
      });

      var action = 'delete'
      io.in(projectId).emit('update tab', {fileName: payload, action: action})
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
      io.in(projectId).emit('role updated', projects[projectId])
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
          if(obj.editor != undefined) {
            var editorJson = JSON.parse(obj.editor);
          }
          editorJson[editorName] = payload.editor;
          redis.hset(`project:${projectId}`, 'editor', JSON.stringify(editorJson))
        });
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
      const fs = require('fs')
      const path = require('path')
      fs.writeFile('pytest.py', payload.code, (err) => {
        if (err) throw err
      })
      const nodepty = require('node-pty')
      if(process.platform === 'win32') pty = nodepty.spawn('python.exe', ['pytest.py'], {})
      else pty = nodepty.spawn('python', ['pytest.py'], {})
      pty.on('data', (data) => {
        io.in(projectId).emit('term update', data)
      })

      setTimeout(pty.kill.bind(pty), 5000);
    })

    /**
     * `pause running code` event fired when user click on pause button from front-end
     * @param {Object} payload code from editor
     */
    client.on('pause run code', (payload) => {
      setTimeout(pty.kill.bind(pty), 0);
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
      const user = User.where({ _id: uid}).findOne(function(err, user){
        if(err);
        if(user){
          const response = {
            user: user,
            message: messageModel
          }
          io.in(projectId).emit('update message', response)
        }
      })
    })


    client.on('is typing', (payload) => {
      io.in(projectId).emit('is typing', payload)
    })

     /**
     * `submit code` event fired when user click on submit button from front-end
     * @param {Object} payload code from editor
     */
    client.on('submit code', (payload) => {
      console.log(payload.mode)
      const mode = payload.mode
      const uid = payload.uid
      const fs = require('fs')
      const path = require('path')
      fs.writeFile('pytest.py', payload.code, (err) => {
        if (err) throw err
      })
      const nodepty = require('node-pty')
      let pty;
      if(process.platform === 'win32') pty = nodepty.spawn('pylint', ['pytest.py'], {})
      else pty = nodepty.spawn('pylint', ['pytest.py'], {})
      pty.on('data', (data) => {
        //get score from pylint
        console.log('data', data)
        const before_score = data.indexOf("Your code has been rated at");
        let score = 0;
        if(before_score != -1) {
          const after_score = data.indexOf("/10");
          score = data.slice(before_score + 28, after_score)
        } else if (data.indexOf('E:') < 0){
          score = 0
        }
        data = data.replace(/\/10/g, "/100.00")
        const uid = payload.uid
        const project = Project.where({pid: projectId}).findOne(function (err, project) {
          if (err);
          if (project) {
            if (project.creator_id != null && project.collaborator_id != null){
              const users = [project.creator_id, project.collaborator_id]
              users.forEach(function(element) {
                const scoreModel = {
                  pid: projectId,
                  uid: element,
                  score: score,
                  createdAt: Date.now()
                }
                const scoreDB = Score.where({pid: projectId, uid: element}).findOne(function (err, oldScore) {
                  if (err) {
                    throw err
                  }
                  if (!oldScore) {
                    new Score(scoreModel, (err) => {
                      if (err) throw err
                    }).save()
                    
                    //recalculate score
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
                            console.log(err);
                            return;
                        }
                        if (results) {
                          // sum = 0;
                          results.forEach(function(result) {
                            console.log("avg: "+result._id+" "+result.score+" "+result.avg);
                            //start update
                            User.update({
                              _id: element
                            }, { 
                              $set: { 
                                avgScore: result.avg
                              }
                            }, 
                            function(err, userReturn){
                              if (err) ;
                              if (userReturn) {
                                console.log(userReturn)
                              }

                            });
                            //end update
                            const shownScore = {
                              score: score,
                              uid: element,
                              avgScore: result.avg
                            }
                            if(mode == "auto"){
                              io.in(projectId).emit('show auto update score', shownScore)
                            } else {
                              io.in(projectId).emit('show score', shownScore)
                              io.in(projectId).emit('show auto update score', shownScore)
                            }
                          })
                        }
                    });
                    //end recalculate score

                  }
                  if (oldScore) {
                    Score.update({
                      pid: projectId, 
                      uid: element
                    }, { 
                      $set: { 
                        score: score 
                      }
                    }, 
                    function(err, scoreReturn){
                      if(err) throw err;
                      if(scoreReturn) {
                        //recalculate score
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
                                console.log(err);
                                return;
                            }
                            if (results) {
                              // sum = 0;
                              results.forEach(function(result) {
                                console.log("avg: "+result._id+" "+result.avg);
                                //start update
                                User.update({
                                  _id: element
                                }, { 
                                  $set: { 
                                    avgScore: result.avg
                                  }
                                }, 
                                function(err, userReturn){
                                  if (err) ;
                                  if (userReturn) {
                                    console.log(userReturn)
                                  }

                                });
                                //end update
                                const shownScore = {
                                  score: score,
                                  uid: element,
                                  avgScore: result.avg
                                }
                                if(mode == "auto"){
                                  io.in(projectId).emit('show auto update score', shownScore)
                                } else {
                                  io.in(projectId).emit('show score', shownScore)
                                  io.in(projectId).emit('show auto update score', shownScore)
                                }
                              })
                            }
                        });
                        //end recalculate score
                        
                      }
                    });
                  }  
                });
              }, this);
            }
          }
        });
        console.log("score"+score)
        io.in(projectId).emit('term update', data)
      })
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

    function countdownTimer() {
        function intervalFunc() {
            redis.hgetall(`project:${projectId}`, function (err, obj) {
                var start = new Date(parseInt(obj.startTime))
                let minutes = moment.duration(swaptime - (Date.now() - start)).minutes();
                let seconds = moment.duration(swaptime - (Date.now() - start)).seconds();
                // console.log(seconds + "secound")
                flag = 0
                if(seconds == 0 && flag != 1){
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
                console.log("swaptime"  + project)
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
        }  else {
          const temp = projects[projectId].roles.coder
          projects[projectId].roles.coder = projects[projectId].roles.reviewer
          projects[projectId].roles.reviewer = temp
          io.in(projectId).emit('role updated', projects[projectId])
        }
    }

    function saveComment(payload){
      const commentModel = {
        line: parseInt(payload.line),
        pid: projectId,
        description: payload.description,
        createdAt: Date.now()
      }
      new Comment(commentModel, (err) => {
          if (err) throw err
      }).save()
      comments.push(payload)
    }

    function updateDesc(line, description){
      for (var i in comments) {
        if (comments[i].line == line) {
           comments[i].description = description;
           break
        }
      }
    }

    // function updateLine(line, description){
    //   for(var i in comments) {
    //     if(comments[i].)
    //   }
    // }

    function readAppend(file, appendFile){
      fs.readFile(appendFile, function(err, data){
        if (err) throw err;
        fs.appendFile(file, '\n', function(err){
          
        })
        fs.appendFile(file, data, function(err){
          console.log('combine!! ')
        })
      })
      
    }

    
  })
}
