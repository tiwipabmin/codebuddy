/**
 * Module dependencies
 */
const express = require('express')

const router = express.Router()

router.use('/', require('./home'))
router.use('/signin', require('./signin'))
router.use('/register', require('./register'))
router.use('/dashboard', require('./dashboard'))
router.use('/lobby', require('./lobby'))
router.use('/project', require('./project'))
router.use('/classroom', require('./classroom'))
router.use('/settings', require('./settings'))
router.use('/aboutus', require('./aboutus'))
router.use('/feature', require('./feature'))
router.use('/profile', require('./profile'))
router.use('/notifications', require('./notifications'))
router.use('/history', require('./history'))
router.use('/api', require('./api'))

router.get('/editprofile', (req, res) => {
  res.render('editprofile')
})

/**
 * Expose `router`
 */
module.exports = router
