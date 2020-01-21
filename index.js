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
require('./models/user')
require('./models/project')
require('./models/comment')
require('./models/message')
require('./models/score')
require('./models/history')

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
const fs = require('fs');
const https = require('https');

try {
  const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
  const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

  const credentials = {key: privateKey, cert: certificate};

  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(process.env.PORT || 8080, () => {
    winston.info('[%s] Listening on 127.0.0.1:%s', chalk.green('✓'), chalk.blue(httpsServer.address().port))
  })

  require('./handlers/socket')(httpsServer)
} catch (err) {

  const httpServer = app.listen(process.env.PORT || 8080, () => {
    winston.info('[%s] Listening on 127.0.0.1:%s', chalk.green('✓'), chalk.blue(httpServer.address().port))
  })

  require('./handlers/socket')(httpServer)
}
