/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')



/**
 * `CollaborativeProject` model schema based on Mongoose schema
 */
const collaborativeProject = new mongoose.Schema({
    pid: {
        type: String,
        default:  shortid.generate
    },
    title: {
        type:String,
        required:  [true, 'Please enter a project title']
    }, 
    description: {
        type: String,
        required: [true, 'Please fill in project description']
    },
    createdAt: { type: Date, default: Date.now },
    creator_id: String,
    creator: String,
    collaborator:{type : Array },
    file: {type:String },
    assignment_id: Number,
    programming_style: { type: String, default: 'Collaborative' },
    week: { type : Number , default: 1 },
    disable_time: { type: Date, default: Date.now },
    enable_time: { type: Date, default: Date.now },
    available_project: { type: Boolean, default: false },
    collaborative_session_id: String

})

/**
 * Expose `Project` model
 */
module.exports = mongoose.model('CollaborativeProject', collaborativeProject)
