 /**
 * Module dependencies
 */
const mongoose = require('mongoose')

/**
 * `Message` model schema based on Mongoose schema
 */
const scoreSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: [true, 'Please enter a author']
  },
  pid: {
    type: String,
    required: [true, 'Please enter a project id']
  },
  score: {
    type: String,
    required: [true, 'Please fill in message']
  },
  createdAt: { type: Date, default: Date.now }
})

/**
 * Expose `Message` model
 */
module.exports = mongoose.model('Score', scoreSchema)
