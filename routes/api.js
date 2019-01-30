const express = require('express')
const auth = require('../middlewares/auth')
const userController = require('../controllers/userController')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

router.get('/usernames', auth.isSignedIn, catchErrors(userController.getUsernames))
router.post('/removeStudent', auth.isSignedIn, catchErrors(webController.removeStudent))

module.exports = router
