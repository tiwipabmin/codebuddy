/**
 * Module dependencies
 */
const express = require('express')

const auth = require('../middlewares/auth')
const webController = require('../controllers/webController')
const { catchErrors } = require('../handlers/errorHandlers')

const router = express.Router()

/**
 * `Classroom` route used as `/classroom`
 * Return the classroom page
 * @method {GET} return rendered `classroom.pug`
 * @method {POST} handle create new section form on `lobby.pug` page
 */
router
  .use(auth.isSignedIn)
  .route('/')
  .get(webController.getSection)
  .post(catchErrors(webController.createSection))

router.get('/getPairingDateTime', auth.isSignedIn, catchErrors(webController.getPairingDateTime))
router.get('/searchUserByPurpose', auth.isSignedIn, catchErrors(webController.searchStudentByPurpose))
router.get('/getStudentsFromSection', auth.isSignedIn, catchErrors(webController.getStudentsFromSection))
router.put('/updatePairingDateTimeStatus', auth.isSignedIn, catchErrors(webController.updatePairingDateTimeStatus))
router.put('/resetPair', auth.isSignedIn, catchErrors(webController.resetPair))
router.post('/joinClass', auth.isSignedIn, catchErrors(webController.joinClass))
router.post('/updateSection', auth.isSignedIn, catchErrors(webController.updateSection))
router.post('/createPairingHistory', auth.isSignedIn, catchErrors(webController.createPairingHistory))

/**
 * Expose `router`
 */
module.exports = router
