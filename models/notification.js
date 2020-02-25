/**
 * Module dependencies
 */
const mongoose = require('mongoose')

/**
 * `Notification` model schema based on Mongoose schema
 */
const notificationSchema = new mongoose.Schema({
 own: String,
 link: String,
 head: String,
 content: String,
 process: String,
 type: String,
 createdAt: { type: Date, default: Date.now },
 info: Object
})

/**
 * Expose `Notification` model
 */
module.exports = mongoose.model('Notification', notificationSchema)
