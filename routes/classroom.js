/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const classroomController = require('../controllers/classroomController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Classroom` route used as `/classroom`
 * Return the classroom page
 * @method {GET} return rendered `classroom.pug`
 * @method {POST} handle create new section form on `lobby.pug` page
 */
router.get('/section/:section_id', auth.isSignedIn, auth.validateSection, catchErrors(classroomController.getSection))
router.post('/', auth.isSignedIn, catchErrors(classroomController.createSection))

router.get('/searchStudentByPurpose', auth.isSignedIn, catchErrors(classroomController.searchStudentByPurpose))
router.get('/getStudentsFromSection', auth.isSignedIn, catchErrors(classroomController.getStudentsFromSection))
router.get('/searchStudent', auth.isSignedIn, catchErrors(classroomController.searchStudent))
router.get('/searchPartner', auth.isSignedIn, catchErrors(classroomController.searchPartner))
router.get('/getPairing', auth.isSignedIn, catchErrors(classroomController.getPairing))
router.get('/getWeeklyAssignments', auth.isSignedIn, catchErrors(classroomController.getWeeklyAssignments))
router.get('/getEnableAssignments', auth.isSignedIn, catchErrors(classroomController.getEnableAssignments))
router.get('/getDisableAssignments', auth.isSignedIn, catchErrors(classroomController.getDisableAssignments))
router.get('/startAutoPairingByPurpose', auth.isSignedIn, catchErrors(classroomController.startAutoPairingByPurpose))
router.get('/startAutoPairingByScoreDiff', auth.isSignedIn, catchErrors(classroomController.startAutoPairingByScoreDiff))
router.put('/updatePairingSession', auth.isSignedIn, catchErrors(classroomController.updatePairingSession))
router.put('/resetPair', auth.isSignedIn, catchErrors(classroomController.resetPair))
router.put('/updatePairing', auth.isSignedIn, catchErrors(classroomController.updatePairing))
router.put('/manageAssignment', auth.isSignedIn, catchErrors(classroomController.manageAssignment))
router.put('/disableAssignments', auth.isSignedIn, catchErrors(classroomController.disableAssignments))
router.put('/enableAssignments', auth.isSignedIn, catchErrors(classroomController.enableAssignments))
router.post('/joinClass', auth.isSignedIn, catchErrors(classroomController.joinClass))
router.post('/updateSection', auth.isSignedIn, catchErrors(classroomController.updateSection))
router.post('/assignAssignment', auth.isSignedIn, catchErrors(classroomController.assignAssignment))
router.post('/createPairingRecord', auth.isSignedIn, catchErrors(classroomController.createPairingRecord))

/**
 * Expose `router`
 */
module.exports = router
