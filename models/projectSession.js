/**
 * Module dependencies
 */
const mongoose = require('mongoose')

/**
 * `Project Session` model schema base on Mongoose schema
 */
const projectSessionSchema = new mongoose.Schema({
    uid: String,
    pid: String,
    dwellingTime: Number,
    activeTime: Number,
    joinedAt: {type: Date, default: Date.now},
    leftAt: {type: Date, default: Date.now},
    noOfActiveUser: Number
})

/**
 * Expose `Project Session` model
 */
module.exports = mongoose.model('ProjectSession', projectSessionSchema)