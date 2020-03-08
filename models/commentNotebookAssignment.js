/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `Comment` model schema based on Mongoose schema
 */
const commentNotebookAssignment = new mongoose.Schema({
   
    bid: {
        type: Number,
        required: [true, 'Please enter a bid']
    },
    line: {
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
    // approve: {
    //     type : Boolean,
    //     default : false
    // },
    // creator_id: String,
})

/**
 * Expose `Comment` model
 */
module.exports = mongoose.model('commentNotebookAssignment', commentNotebookAssignment)
