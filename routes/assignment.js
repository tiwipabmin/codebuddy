/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const assignmentController = require('../controllers/assignmentController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Assignment` route used as `/assignment`
 * Return the assignment page used in classroom
 * @method {GET} return rendered `assignment.pug`
 * @method {POST} handle create new assignment form on `assignment.pug` page
 */
router.get('/view/:assignment_id/section/:section_id', auth.isSignedIn, auth.validateSection, catchErrors(assignmentController.getAssignment))
router.get('/getform/section/:section_id', auth.isSignedIn, catchErrors(assignmentController.getAssignmentForm))
router.post('/createassignment', auth.isSignedIn, catchErrors(assignmentController.createAssignment))

router.post('/updateassignment', auth.isSignedIn, catchErrors(assignmentController.updateAssignment))

router.delete('/deleteAssignment', auth.isSignedIn, catchErrors(assignmentController.deleteAssignment))

/**
 * Expose `router`
 */
module.exports = router
