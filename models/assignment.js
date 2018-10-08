/**
 * Module dependencies
 */
const mongoose = require('mongoose')

/**
 * `Assignment` model schema based on Mongoose schema
 */
const assignmentSchema = new mongoose.Schema({
 aid: String,
 topicName: {
   type: String,
   required: [true, 'Please enter a topic name']
 },
 description: {
   type: String,
   required: [true, 'Please enter a description']
 },
 cid: String,
 creator_id: String,
 createdAt: { type: Date, default: Date.now }
})

/**
 * Expose `Assignment` model
 */
module.exports = mongoose.model('Assignment', assignmentSchema)
