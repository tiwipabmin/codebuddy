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
router.get('/getcomments', auth.isSignedIn, catchErrors(webController.getComments))
router.get('/gethistories', auth.isSignedIn, catchErrors(webController.getHistories))
router.get('/getmessages', auth.isSignedIn, catchErrors(webController.getMessages))
router.get('/getprojects', auth.isSignedIn, catchErrors(webController.getProjects))
router.get('/getscores', auth.isSignedIn, catchErrors(webController.getScores))
router.get('/getusers', auth.isSignedIn, catchErrors(webController.getUsers))
router.put('/updateTotalScoreAllStudent', auth.isSignedIn, catchErrors(webController.updateTotalScoreAllStudent))

/**
 * Expose `router`
 */
module.exports = router
