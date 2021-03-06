/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `Notification` model schema based on Mongoose schema
 */
const notificationSchema = new mongoose.Schema({
    nid: {
        type: String,
        default: shortid.generate
    },
    receiver: Array,
    link: String,
    head: String,
    content: String,
    status: String,
    type: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    info: Object
})

/**
 * Expose `Notification` model
 */
module.exports = mongoose.model('Notification', notificationSchema)
