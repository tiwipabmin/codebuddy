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
  const keyStores = {} // store key in each classroom

  // Event routing
  io.on('connection', (client) => {
    client.on('load playground', (payload) => {
      if (payload.programming_style == 'Interactive') {
        require('./playgroundInteractive.js')(io, client, redis, projects)
      } else if (payload.programming_style == 'Co-located') {
        require('./playgroundCo_located.js')(io, client, redis, projects)
      } else if (payload.programming_style == 'Remote') {
        require('./playgroundRemote.js')(io, client, redis, projects)
      } else if (payload.programming_style == 'Individual') {
        require('./playgroundIndividual.js')(io, client, redis, projects)
      }
    })

    client.on('notification', (payload) => {
      require('./notification.js')(io, client, keyStores)
    })
  })
}
