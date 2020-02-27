/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Dashboard` route used as `/dashboard`
 * Finding user projects from database and pass results to the dashboard file
 * @method {GET} return rendered `dashboard.pug`
 */
router.get('/', auth.isSignedIn, catchErrors(webController.getNotifications))
router.post('/createProjectNotification', auth.isSignedIn, catchErrors(webController.createProjectNotification))
router.put('/updateProjectNotification', auth.isSignedIn, catchErrors(webController.updateProjectNotification))
router.put('/finishedNotificationProcess', auth.isSignedIn, catchErrors(webController.finishedNotificationProcess))

/**
 * Expose `router`
 */
module.exports = router
