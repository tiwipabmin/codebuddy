const express = require('express')
const auth = require('../middlewares/auth')
const userController = require('../controllers/userController')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

router.get('/usernames', auth.isSignedIn, catchErrors(userController.getUsernames))
router.delete('/removeStudent', auth.isSignedIn, catchErrors(webController.removeStudent))
router.delete('/deleteSection', auth.isSignedIn, catchErrors(webController.deleteSection))

module.exports = router
