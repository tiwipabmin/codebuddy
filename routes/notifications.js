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
// router.get('/', auth.isSignedIn, catchErrors(webController.getNotifications))
router.put('/change/system/usage/status', auth.isSignedIn, catchErrors(webController.changeSystemUsageStatus))
router.put('/changeProjectNotificationStatus', auth.isSignedIn, catchErrors(webController.changeProjectNotificationStatus))

/**
 * Expose `router`
 */
module.exports = router
