const socketio = require('socket.io')
const winston = require('winston')
const Redis = require('ioredis')
const mongoose = require('mongoose')
const timer = require('timers')
const moment = require('moment')

const Project = mongoose.model('Project')
const Message = mongoose.model('Message')
const Score = mongoose.model('Score')

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

    winston.info('Client connected')

    client.on('submit review', (payload) => {
      // projects[projectId]['reviews'].push(payload)
      console.log(payload)
        redis.hset(`project:${projectId}`, `line`+payload.line , payload.description)
      io.in(projectId).emit('new review', payload)

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
      } catch (error) {
        winston.info(`catching error: ${error}`)
      }
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
        client.to(projectId).emit('editor update', payload.code)
        console.log(payload);
        console.log("code " + payload.code.text[0]);
        redis.hset(`project:${projectId}`, 'editor', payload.editor)
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
      let pty;
      if(process.platform === 'win32') pty = nodepty.spawn('python.exe', ['pytest.py'], {})
      else pty = nodepty.spawn('python', ['pytest.py'], {})
      pty.on('data', (data) => {
        io.in(projectId).emit('term update', data)
      })
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
      io.in(projectId).emit('update message', messageModel)
    })

     /**
     * `submit code` event fired when user click on submit button from front-end
     * @param {Object} payload code from editor
     */
    client.on('submit code', (payload) => {
      console.log('summit code')
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
          const after_score = data.indexOf("/10 (previous run:");
          score = data.slice(before_score + 28, after_score)
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
                      io.in(projectId).emit('show score', score)
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
                        }
                      });
                      io.in(projectId).emit('show score', score)
                    }  
                  });
                }, this);
              }
            }
          });
        }
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
        const temp = projects[projectId].roles.coder
        projects[projectId].roles.coder = projects[projectId].roles.reviewer
        projects[projectId].roles.reviewer = temp
        io.in(projectId).emit('role updated', projects[projectId])
    }
  })
}
