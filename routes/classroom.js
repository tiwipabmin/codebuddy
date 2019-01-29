/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Project` route used as `/project`
 * Return the classroom page used in pair-programming collaboration
 * @method {GET} return rendered `classroom.pug`
 * @method {POST} handle create new project form on `classroom` page
 */
router
  .use(auth.isSignedIn)
  .route('/')
  .get(webController.getClassroom)
  .post(catchErrors(webController.createClassroom))

router.post('/joinClass', auth.isSignedIn, catchErrors(webController.joinClass))

/**
 * Expose `router`
 */
module.exports = router
