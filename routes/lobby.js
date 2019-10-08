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
router.get('/', auth.isSignedIn, catchErrors(webController.getLobby))
router.get('/getProgress', auth.isSignedIn, catchErrors(webController.getProgress))
router.delete('/deleteSection', auth.isSignedIn, catchErrors(webController.deleteSection))

/**
 * Expose `router`
 */
module.exports = router
