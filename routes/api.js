const express = require('express')
const auth = require('../middlewares/auth')
const userController = require('../controllers/userController')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

router.get('/usernames', auth.isSignedIn, catchErrors(userController.getUsernames))
router.get('/students', auth.isSignedIn, catchErrors(webController.getStudents))
router.get('/search', auth.isSignedIn, catchErrors(webController.searchStudents))

module.exports = router
