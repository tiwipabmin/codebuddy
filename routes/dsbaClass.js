/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const dsbaClassController = require('../controllers/dsbaClassController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `dsbaClass` route used as `/dsbaClass`
 * @method {GET} return rendered `collaborative.pug`
 * @method {POST} handle create new class form on `collaborative.pug` page
 */

router.get('/getStudentsFromSection', auth.isSignedIn, auth.validateSection, catchErrors(dsbaClassController.getStudentsFromSection))
router.get('/weeklyAssignments', auth.isSignedIn, catchErrors(dsbaClassController.weeklyAssignments))
router.post('/createGroupRecord', auth.isSignedIn, catchErrors(dsbaClassController.createGroupRecord))
router.post('/assignAssignment', auth.isSignedIn, catchErrors(dsbaClassController.assignAssignment))
router.put('/completeGroupSession', auth.isSignedIn,  catchErrors(dsbaClassController.completeGroupSession))
router.put('/manageAssignment', auth.isSignedIn,  catchErrors(dsbaClassController.manageAssignment))

/**
 * Expose `router`
 */
module.exports = router
