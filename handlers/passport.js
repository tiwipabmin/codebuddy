/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local').Strategy

const User = mongoose.model('User')
const bcrypt = require('bcrypt')
const Redis = require('ioredis')
const con = require('../my_sql')

function config(passport) {
  /**
   * serialize users and only parse the user id to the session
   * @param {Object} user user instance
   * @param {Function} done callback function
   */
  passport.serializeUser((user, done) => {
    // console.log('serializeUser, ', user)
    done(null, user.id)
  })

  /**
   * deserialize users out of the session to get the ID that used to find user
   * @param {String} id user id
   * @param {Function} done callback function
   */
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      return done(null, user)
    } catch(err) {
      return done(err)
    }
  })

  /**
   * passport strategy for local register
   */
  passport.use('local-register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    // checks if user or email is already exists
    if (await User.findOne({ $or: [{ email }, { username: req.body.username }] })) {
      return done(null, false, { message: 'Username or Email is already exist' })
    }
    let username = req.body.username
    let firstname = req.body.firstname.trim()
    let lastname = req.body.lastname.trim()
    let occupation = req.body.occupation
    let gender = req.body.gender
    let insertStudent = "INSERT INTO " + occupation + " (username, first_name, last_name, email, gender) VALUES ?";
    let values = [[username, firstname, lastname, email, gender]]
    let subjectId = await con.insertStudent(insertStudent, values)
    if(subjectId != 'Insert Failed!') {
      // saves user to database
      let user = await new User({
        username: username,
        email: email,
        password: password,
        img: '/images/user_img_' + Math.floor((Math.random() * 7) + 0) + '.jpg',
        info: {
          firstname: firstname,
          lastname: lastname,
          occupation: occupation,
          gender: gender
        },
        subjectId: subjectId
      }).save()
      return done(null, user)
    }
    return done(null, false, { message: 'Error, please register again.' })
  }))

  /**
   * Passport strategy for local sign in
   */
  passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const redis = new Redis()
      const user = await User.findOne({ $or: [{ email }, { username: email }]})
      if (!user) {
        return done(null, false, { message: 'Username or Email is not exist'})
      }
      let verifyPassword = await user.verifyPassword(password)
      if (verifyPassword) {
        const systemAccessTime = user.systemAccessTime + 1
        const resStatus = await User.updateOne({
          $or: [{ email }, { username: email }]
        }, {
          $set: {
            systemAccessTime: systemAccessTime
          }
        }, (err) => {
          if (err) throw err
        })
        console.log('user, user , verifyPassword, ', verifyPassword, ', username, ', user.username, ', resStatus, ', resStatus)
        return done(null, user)
      } else {
        return done(null, false, { message: 'Wrong password' })
      }
    } catch (err) {
      return done(err)
    }
  }))
}

/**
 * Expose `config` for passport instance
 */
module.exports = config
