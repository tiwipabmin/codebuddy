/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const notebookAssignmentController = require('../controllers/notebookAssignmentController')
// const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `notebookAssignment` route used as `/notebookAssignment`
 * Return the assignment page used in classroom
 * @method {GET} return rendered `notebookAssignment.pug`
 * @method {POST} handle create new assignment form on `notebookAssignment.pug` page
 */
router.get('/', auth.isSignedIn, catchErrors(notebookAssignmentController.getNotebookAssignment))
router.get('/StudentExport', auth.isSignedIn, catchErrors(notebookAssignmentController.exportNotebookFileStudent))
router.post('/StudentExport', auth.isSignedIn, catchErrors(notebookAssignmentController.exportNotebookFileStudent))
router.delete('/deleteAssignment', auth.isSignedIn, catchErrors(notebookAssignmentController.deleteAssignment))




// router.post('/updateAssignment', auth.isSignedIn, catchErrors(webController.updateAssignment))

/**
 * Expose `router`
 */
module.exports = router
