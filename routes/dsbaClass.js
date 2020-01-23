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

/**
 * Expose `router`
 */
module.exports = router
