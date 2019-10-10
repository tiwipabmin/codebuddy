/**
 * Module dependencies
 */
const express = require('express')

const router = express.Router()

router.use('/', require('./home'))
router.use('/signin', require('./signin'))
router.use('/register', require('./register'))
router.use('/profile', require('./profile'))
router.use('/lobby', require('./lobby'))
router.use('/dataService', require('./dataService'))
router.use('/project', require('./project'))
router.use('/classroom', require('./classroom'))
router.use('/settings', require('./settings'))
router.use('/notifications', require('./notifications'))
router.use('/history', require('./history'))
router.use('/api', require('./api'))
router.use('/assignment', require('./assignment'))

router.get('/editprofile', (req, res) => {
  res.render('editprofile')
})

/**
 * Expose `router`
 */
module.exports = router
