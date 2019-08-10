/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Data service` route used as `/dataService`
 * Return the counter page
 * @method {GET} return rendered `counter.pug`
 * @method {POST} handle import new data form on `counter.pug` page
 */
router.get('/', auth.isSignedIn, catchErrors(webController.getCounter))
router.put('/updateTotalScoreAllStudent', auth.isSignedIn, catchErrors(webController.updateTotalScoreAllStudent))

/**
 * Expose `router`
 */
module.exports = router
