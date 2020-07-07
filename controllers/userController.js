const passport = require('passport')
const mongoose = require('mongoose')
const conMysql = require('../mySql')

const User = mongoose.model('User')
const Project = mongoose.model("Project");

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

  /** Username Field */
  req.checkBody('username', 'You must enter a username!').notEmpty()
  req.checkBody('username', 'This username is not valid!').isAlphanumeric()

  /** Email Field */
  req.checkBody('email', 'You must enter an email address!').notEmpty()
  req.checkBody('email', 'This email is not valid!').isEmail()
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmaiL_remove_subaddress: false
  })

  /** Password Field */
  req.checkBody('password')
    .notEmpty()
    .withMessage('Password cannot be blank!')
    .isLength({ min: 8 })
    .withMessage('This password must be at least 8 chars long.')
    .isAlphanumeric()
    .withMessage('This password is not valid!')

  let comparePassword = function (password, confirmPassword) {
    if (confirmPassword === password) {
      return true;
    }
    return false;
  }

  let validateName = function (name) {
    let specialLiteral = '!@#$%^&*()_+-={}|[]\\\:\;\'\"<>?/,..ฺ'
    for (let index in name) {
      if (specialLiteral.indexOf(name[index]) != -1) {
        return false
      }
    }
    return true
  }

  /** Firstname Field */
  req.checkBody('firstname')
    .notEmpty()
    .withMessage('Please enter your First Name!')
    .isAlpha()
    .withMessage('This firstname is not valid!')
  let firstname = req.body.firstname
  let isValidFirstname = validateName(firstname)

  /** Lastname Field */
  req.checkBody('lastname')
    .notEmpty()
    .withMessage('Please enter your Last Name!')
    .isAlpha()
    .withMessage('This lastname is not valid!')
  let lastname = req.body.lastname
  let isValidLastname = validateName(lastname)

  // req.checkBody('agree', 'Please read and accept our Terms and Conditions').notEmpty()

  let errors = req.validationErrors()
  if (!comparePassword(req.body.password, req.body.confirmPassword)) {
    if (errors === false) {
      errors = []
    }
    errors.push({ msg: 'Password does not match!' })
  }

  if (!isValidFirstname) {
    if (errors === false) {
      errors = []
    }
    errors.push({ msg: 'This firstname must not have special literal!' })
  }

  if (!isValidLastname) {
    if (errors === false) {
      errors = []
    }
    errors.push({ msg: 'This lastname must not have special literal!' })
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
exports.getProfile = async (req, res) => {
  const user = req.user;
  const studentQuery = `SELECT student_id FROM student WHERE username = "${user.username}"`
  const students = await conMysql.selectStudent(studentQuery)
  const studentId = String(students[0].student_id)
  let subjectId = `00000${studentId}`
  subjectId = subjectId.slice(studentId.length, subjectId.length)
  console.log('Subject Id, ', subjectId)

  dataSets = { origins: { user: user, subjectId: subjectId } }

  res.render("profile", { dataSets, title: user.username + ' Profile' })
}

exports.validateToUpdateProfile = async (req, res, next) => {
  const user = req.user;
  let username = req.params.username
  let currentPassword = req.body.currentPassword
  let newPassword = req.body.newPassword
  let confirmPassword = req.body.confirmPassword
  let verifyPassword = false
  let email = req.body.email
  let firstname = req.body.firstname
  let lastname = req.body.lastname

  /** Keep updated data */
  let dataOfMongoDb = {}
  let dataOfMySql = {}

  let dataSets = { origins: { user: user } }

  let comparePassword = (password, confirmPassword) => {
    if (confirmPassword === password) {
      return true;
    }
    return false;
  }

  let validateName = (name) => {
    let specialLiteral = '!@#$%^&*()_+-={}|[]\\\:\;\'\"<>?/,..ฺ'
    for (let index in name) {
      if (specialLiteral.indexOf(name[index]) != -1) {
        return false
      }
    }
    return true
  }

  /** Password Field */
  if (newPassword) {

    req.checkBody('newPassword')
      .notEmpty()
      .withMessage('Password cannot be blank!')
      .isLength({ min: 8 })
      .withMessage('This password must be at least 8 chars long.')
      .isAlphanumeric()
      .withMessage('This password is not valid!')

    verifyPassword = await req.user.verifyPassword(currentPassword)

    dataOfMongoDb.password = null
    dataOfMySql.password = null
  }

  /** Email Field */
  if (email) {
    let orgEmail = req.user.email
    if (email !== orgEmail) {
      req.checkBody('email', 'You must enter an email address!').notEmpty()
      req.checkBody('email', 'This email is not valid!').isEmail()
      req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmaiL_remove_subaddress: false
      })

      dataOfMongoDb.email = email
      dataOfMySql.email = email
    }
  }

  /** Fistname Field */
  if (firstname) {
    let orgFirstname = req.user.info.firstname
    if (firstname !== orgFirstname) {
      req.checkBody('firstname')
        .notEmpty()
        .withMessage('Please enter your First Name!')
        .isAlpha()
        .withMessage('This firstname is not valid!')

      dataOfMongoDb["info.firstname"] = firstname
      dataOfMySql.first_name = firstname

    }
  }

  /** Lastname Field */
  if (lastname) {
    let orgLastname = req.user.info.lastname
    if (lastname !== orgLastname) {
      req.checkBody('lastname')
        .notEmpty()
        .withMessage('Please enter your Last Name!')
        .isAlpha()
        .withMessage('This lastname is not valid!')

      dataOfMongoDb["info.lastname"] = lastname
      dataOfMySql.last_name = lastname

    }
  }

  let countDataOfMongoDb = Object.keys(dataOfMySql).length
  let countDataOfMySql = Object.keys(dataOfMySql).length
  
  /** Does data updated */
  if (countDataOfMongoDb && countDataOfMySql) {

    let errors = req.validationErrors()
    if (dataOfMongoDb.password !== undefined
      && dataOfMySql.password !== undefined) {

      if (!verifyPassword) {
        if (errors === false) {
          errors = []
        }
        errors.push({ msg: 'The current password is incorrect!' })
      } else {
        dataOfMongoDb.password = newPassword
        dataOfMySql.password = newPassword
      }

    }

    if (!comparePassword(newPassword, confirmPassword)) {
      if (errors === false) {
        errors = []
      }
      errors.push({ msg: 'Password does not match!' })
    }

    let isValidFirstname = validateName(firstname)

    if (!isValidFirstname && dataOfMySql.first_name !== undefined) {
      if (errors === false) {
        errors = []
      }
      errors.push({ msg: 'This firstname must not have special literal!' })
    }

    let isValidLastname = validateName(lastname)

    if (!isValidLastname && dataOfMySql.last_name !== undefined) {
      if (errors === false) {
        errors = []
      }
      errors.push({ msg: 'This lastname must not have special literal!' })
    }

    if (errors) {

      dataSets.origins.status = `Update profile failed!`

      req.flash('error', errors.map(err => err.msg))
      res.render(`profile`, { title: `${username} Profile`, dataSets, flashes: req.flash() })
      return

    } else {

      req.dataOfMongoDb = dataOfMongoDb
      req.dataOfMySql = dataOfMySql
      next()
    }
  } else {

    dataSets.origins.status = `Nothing updated!`
    res.render("profile", { dataSets, title: user.username + ' Profile' })
  }
}

exports.updateProfile = async (req, res) => {
  let user = req.user;
  let username = req.params.username
  let dataOfMongoDb = req.dataOfMongoDb
  let dataOfMySql = req.dataOfMySql
  let dataSets = { origins: { user: user } }

  if (Object.keys(dataOfMongoDb).length) {

    if (dataOfMongoDb.password !== undefined) {
      dataOfMongoDb.password = await user.hashPassword(dataOfMongoDb.password)

      /** verify hashPassword error */
      if (!dataOfMongoDb.password) {
        let errors = []
        errors.push({ msg: 'Cannot change password. Please, verify your new password.' })

        dataSets.origins.status = `Update profile failed!`

        req.flash('error', errors.map(err => err.msg))
        res.render(`profile`, { title: `${username} Profile`, dataSets, flashes: req.flash() })
        return
      }
    }

    await User.updateOne(
      { username: username },
      { $set: dataOfMongoDb }
    )

  }

  const writeStudentQuery = function (username, dataOfMySql) {
    let head = `UPDATE student SET `
    let middle = []
    for (let item in dataOfMySql) {
      middle.push(`${item} = '${dataOfMySql[item]}'`)
    }
    middle = middle.join(', ')
    let end = ` WHERE username = '${username}'`
    return head + middle + end
  }

  if (Object.keys(dataOfMySql).length) {

    if (dataOfMySql.password === undefined) {
      let queryStudent = writeStudentQuery(username, dataOfMySql)
      await conMysql.updateStudent(queryStudent).then((data) => {
        console.log(data)
      });
    }
  }

  user = await User.findOne({
    username: user.username
  })

  dataSets.origins.user = user
  dataSets.origins.status = `Update profile successfully!`

  res.render(`profile`, { title: `${username} Profile`, dataSets })
}

exports.getDashboard = async (req, res) => {
  const username = req.params.username;
  let dataSets = {};
  let pid = [];

  const projects = await Project.find({
    $or: [{ creator: username }, { collaborator: username }]
  }).sort({ createdAt: -1 });

  for (_index in projects) {
    pid.push(projects[_index].pid);
  }

  dataSets = { origins: { username: username, pid: pid } };

  res.render("dashboard", { dataSets, title: username + " Progress" });
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
