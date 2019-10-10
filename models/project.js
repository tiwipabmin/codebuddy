/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `Project` model schema based on Mongoose schema
 */
const projectSchema = new mongoose.Schema({
  pid: {
    type: String,
    default: shortid.generate
  },
  title: {
    type: String,
    required: [true, 'Please enter a project title']
  },
  description: {
    type: String,
    required: [true, 'Please fill in project description']
  },
  createdAt: { type: Date, default: Date.now },
  creator_id: String,
  creator: String,
  collaborator_id: String,
  collaborator: String,
  language: { type: String, default: 'py' },
  swaptime: {type : String, default: '5'},
  files: { type : Array , default: ['main'] },
  assignment_id: Number,
  programming_style: { type: String, default: 'Remote' },
  week: { type : Number , default: 1 },
  disable_time: { type: Date, default: Date.now },
  enable_time: { type: Date, default: Date.now },
  available_project: { type: Boolean, default: false }
})

/**
 * Expose `Project` model
 */
module.exports = mongoose.model('Project', projectSchema)
