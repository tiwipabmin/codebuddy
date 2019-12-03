/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `Comment` model schema based on Mongoose schema
 */
const commentSchema = new mongoose.Schema({
    file: {
        type: String,
        required: [true, 'Please enter a file name']
    },
    block_id: {
        type: Number,
        required: [true, 'Please enter a line']
    },
    pid: {
        type: String,
        required: [true, 'Please enter a pid']
    },
    description: {
        type: String,
        required: [true, 'Please enter a comment']
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    creator_id: String,
})

/**
 * Expose `Comment` model
 */
module.exports = mongoose.model('Comment', commentSchema)
