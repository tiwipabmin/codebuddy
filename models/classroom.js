/**
 * Module dependencies
 */
const mongoose = require('mongoose')

/**
 * `Classroom` model schema based on Mongoose schema
 */
const classroomSchema = new mongoose.Schema({
 cid: String,
 classroomName: {
   type: String,
   required: [true, 'Please enter a classroom name']
 },
 room: {
   type: String,
   required: [true, 'Please enter a room']
 },
 section: {
   type: String,
   required: [true, 'Please enter a section']
 },
 creator_id: String,
 sid: Array,
 createdAt: { type: Date, default: Date.now }
})

/**
 * Expose `Classroom` model
 */
module.exports = mongoose.model('Classroom', classroomSchema)
