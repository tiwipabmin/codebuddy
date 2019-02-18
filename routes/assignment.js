/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Assignment` route used as `/assignment`
 * Return the assignment page used in classroom
 * @method {GET} return rendered `assignment.pug`
 * @method {POST} handle create new assignment form on `assignment.pug` page
 */
router
  .use(auth.isSignedIn)
  .route('/')
  .get(webController.getAssignment)
  .post(catchErrors(webController.createAssignment))

/**
 * Expose `router`
 */
module.exports = router
