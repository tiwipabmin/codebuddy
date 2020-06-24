/**
 * Setting file for set up all middlewares that needed for server
 */

/**
 * Module dependencies
 */
const express = require('express')
const session = require('express-session')
const path = require('path')
const flash = require('connect-flash')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const redis = require('connect-redis')
const passport = require('passport')
const expressValidator = require('express-validator')
const moment = require('moment')
const compression = require('compression')

/**
 * Config dependencies
 */
const RedisStore = redis(session)
const passportConfig = require('../handlers/passport')

/**
 * Expose `settings`
 */
module.exports = (app) => {
  // middlewares setting
  if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  } else {
    app.use(compression());
  }

  // view engine setup
  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'pug')

  app.use(flash())
  app.use(expressValidator())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: true
  }))
  app.use(express.static(path.join(__dirname, '../public')))
  app.use(session({
    key: process.env.KEY,
    secret: process.env.SECRET,
    store: new RedisStore({
      url: process.env.REDIS_SERVER
    }),
    resave: true,
    saveUninitialized: true
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  passportConfig(passport)
  app.use((req, res, next) => {
    res.locals.flashes = req.flash()
    res.locals.user = req.user || null
    res.locals.moment = moment
    next()
  })
}
