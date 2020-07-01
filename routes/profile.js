/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const userController = require('../controllers/userController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Project` route used as `/project`
 * Return the playground page used in pair-programming collaboration
 * @method {GET} return rendered `playground.pug`
 * @method {POST} handle create new project form on `dashboard` page
 */
router
  .use(auth.isSignedIn)
  .route('/dashboard/:username')
  .get(catchErrors(userController.getDashboard))

router
  .use(auth.isSignedIn)
  .route('/')
  .get(catchErrors(webController.getProfileByTeacher))

router
  .use(auth.isSignedIn)
  .route('/getCode/:pid')
  .get(catchErrors(webController.getEditorCode))

router
  .use(auth.isSignedIn)
  .route('/:username')
  .get(catchErrors(userController.getProfile))

router
  .use(auth.isSignedIn)
  .route('/:username')
  // .post(catchErrors(userController.validateToUpdateProfile))
  .post(catchErrors(userController.validateToUpdateProfile), catchErrors(userController.updateProfile))

/**
 * Expose `router`
 */
module.exports = router
