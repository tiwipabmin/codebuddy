 /**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `History` model schema based on Mongoose schema
 */
const historySchema = new mongoose.Schema({
  pid: {
    type: String,
    required: [true, 'Please enter a pid']
  },
  file: String,
  line: {
    type: Number,
    required: [true, 'Please enter a line']
  },
  ch: {
    type: Number,
    required: [true, 'Please enter a character']
  },
  text: {
    type: String,
    required: [true, 'Please enter a text']
  },
  user:{
    type: String,
    required: [true, 'Please enter a username']
  },
  createdAt: { type: Date, default: Date.now }
})

/**
 * Expose `History` model
 */
module.exports = mongoose.model('History', historySchema)