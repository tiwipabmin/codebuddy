const passport = require('passport')
const mongoose = require('mongoose')
const con = require('../mySql')

const User = mongoose.model('User')

/**
 * Sign In Form `/signin`
 */
exports.getSigninForm = (req, res) => {
  res.render('signin')
}

exports.postSigninForm = passport.authenticate('local-signin', {
  successRedirect: '/lobby',
  failureRedirect: '/signin',
  failureFlash: true
})

/**
 * Register Form `/register`
 */
exports.getRegisterForm = (req, res) => {
  res.render('register', { title: 'Register' })
}

exports.postRegisterForm = passport.authenticate('local-register', {
  successRedirect: '/lobby',
  failureRedirect: '/register',
  failureFlash: true
})

/**
 * Validate request body by using express-validator
 */
exports.validateRegister = (req, res, next) => {

  // username field
  req.checkBody('username', 'You must enter a username!').notEmpty()
  req.checkBody('username', 'This username is not valid!').isAlphanumeric()

  // email field
  req.checkBody('email', 'You must enter an email address!').notEmpty()
  req.checkBody('email', 'This email is not valid!').isEmail()
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmaiL_remove_subaddress: false
  })

  // password field
  req.checkBody('password')
  .notEmpty()
  .withMessage('Password cannot be blank!')
  .isLength({min: 8})
  .withMessage('This password must be at least 8 chars long.')
  .isAlphanumeric()
  .withMessage('This password is not valid!')

  let validateName = function (name) {
    let specialLiteral = '!@#$%^&*()_+-={}|[]\\\:\;\'\"<>?/,..ฺ'
    for (let index in name) {
      if (specialLiteral.indexOf(name[index]) != -1) {
        return false
      }
    }
    return true
  }

  // Personal information field
  req.checkBody('firstname')
  .notEmpty()
  .withMessage('Please enter your First Name!')
  .isAlpha()
  .withMessage('This firstname is not valid!')
  let firstname = req.body.firstname
  let isValidFirstname = validateName(firstname)

  req.checkBody('lastname')
  .notEmpty()
  .withMessage('Please enter your Last Name!')
  .isAlpha()
  .withMessage('This lastname is not valid!')
  let lastname = req.body.lastname
  let isValidLastname = validateName(lastname)

  // req.checkBody('agree', 'Please read and accept our Terms and Conditions').notEmpty()

  let errors = req.validationErrors()
  if (!isValidFirstname) {
    if(errors === false) {
      errors = []
    }
    errors.push({msg: 'This firstname must not have special literal!'})
  }

  if (!isValidLastname) {
    if(errors === false) {
      errors = []
    }
    errors.push({msg: 'This lastname must not have special literal!'})
  }
  if (errors) {
    req.flash('error', errors.map(err => err.msg))
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() })
    return
  }
  next()
}

/**
 * Profile `/profile`
 */
exports.getSettingProfile = (req, res) => {
  res.render('editprofile')
}

exports.getProfile = async (req, res) => {
  const username = req.params.username
  const user = await User.findOne({ username })
  res.render('profile', { title: `${user.username} profile`, user })
}

/**
 * Used by autocomplete function in create project
 */
exports.getUsernames = async (req, res) => {
  const data = await User.find({}, { username: 1, _id: 0 }).lean()
  let temp = []
  data.map(obj => {
    temp.push(obj.username)
  })
  res.json(temp).status(200)
}
