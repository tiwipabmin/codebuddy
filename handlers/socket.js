const socketio = require('socket.io')
const Redis = require('ioredis')

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
    client.on('load playground', (payload) => {
      if (payload.programming_style == 'interactive') {
        require('./playgroundInteractive.js')(io, client, redis, projects)
      } else {
        let sub_style = payload.programming_style.split(' ')
        console.log('sub_style, ', sub_style)
        if(sub_style[1] == 'codebuddy') {
          require('./playgroundConventional_codebuddy.js')(io, client, redis, projects)
        } else {
          require('./playgroundConventional_typical.js')(io, client, redis, projects)
        }
      }
    })
  })
}
