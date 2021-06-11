/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const lobbyController = require('../controllers/lobbyController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Dashboard` route used as `/dashboard`
 * Finding user projects from database and pass results to the dashboard file
 * @method {GET} return rendered `dashboard.pug`
 */
router.get('/', auth.isSignedIn, catchErrors(lobbyController.getLobby))
router.get('/getProgress', auth.isSignedIn, catchErrors(lobbyController.getProgress))
router.delete('/deleteSection', auth.isSignedIn, catchErrors(lobbyController.deleteSection))

/**
 * Expose `router`
 */
module.exports = router
