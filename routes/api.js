const express = require('express')
const auth = require('../middlewares/auth')
const userController = require('../controllers/userController')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

router.get('/usernames', auth.isSignedIn, catchErrors(userController.getUsernames))
router.get('/downloadFile', auth.isSignedIn, catchErrors(webController.downloadFile))
router.get('/projects', auth.isSignedIn, catchErrors(webController.getMyProjects))
router.delete('/removeStudent', auth.isSignedIn, catchErrors(webController.removeStudent))
router.delete('/deleteAssignment', auth.isSignedIn, catchErrors(webController.deleteAssignment))

module.exports = router
