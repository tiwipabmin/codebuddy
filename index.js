/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const winston = require('winston')
const chalk = require('chalk')
const Redis = require('ioredis')

/**
 * Load environment variables config to `process.env`
 */
require('dotenv').config()

/**
 * Initiate MongoDB connection
 */
mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URL, (err) => {
  if (err) {
    winston.error(`[%s] ${err.message}`, chalk.red('✗'))
    winston.info('[%s] Please make sure MongoDB is running', chalk.yellow('†'))
    process.exit()
  }
  winston.info('[%s] Connect to MongoDB server successfully', chalk.green('✓'))
})
mongoose.connection.on('error', (err) => {
  winston.error(`[%s] ${err.message}`, chalk.red('✗'))
})

require('./models/comment')
require('./models/history')
require('./models/message')
require('./models/notification')
require('./models/project')
require('./models/score')
require('./models/user')


/**
 * Checking Redis server is available
 */
new Redis().on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    winston.error(`[%s] Can't connect to Redis ${err.address}:${err.port}`, chalk.red('✗'))
    winston.info('[%s] Please make sure Redis server is running', chalk.yellow('†'))
    process.exit()
  }
  winston.error(`[%s] ${err}`, chalk.red('✗'))
})

/**
 * Start server and initiate socket.io server
 */
const app = require('./server')
const config = require('getconfig')
const fs = require('fs')
const sockets = require('./signaling/sockets')
let server = null;

// let serverHandler = function (req, res) {
//   if (req.url === '/healthcheck') {
//     console.log(Date.now(), 'healthcheck');
//     res.writeHead(200);
//     res.end();
//     return;
//   }
//   res.writeHead(404);
//   res.end();
// }

// Create an http(s) server instance to that socket.io can listen to
// if (config.server.secure) {
//   console.log('HTTPS, ', config.server.secure)
//   server = require('https').Server({
//     key: fs.readFileSync(config.server.key),
//     cert: fs.readFileSync(config.server.cert),
//     passphrase: config.server.password
//   }, serverHandler);
// } else {
//   console.log('HTTP, ', config.server.secure)
//   server = require('http').Server(serverHandler);
// }

server = app.listen(process.env.PORT || 8080, () => {
  winston.info('[%s] Listening on 127.0.0.1:%s', chalk.green('✓'), chalk.blue(server.address().port))
})

require('./handlers/socket')(server);
sockets(server, config);
