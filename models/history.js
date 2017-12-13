 /**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `History` model schema based on Mongoose schema
 */
const historySchema = new mongoose.Schema({
  from: {
    line: {
      type: Number,
      required: 'Please enter a line',
    },
    ch: {
      type: Number,
      required: 'Please enter a character',
    }
  }, 
  to: {
    line: {
      type: Number,
      required: 'Please enter a line',
    },
    ch: {
      type: Number,
      required: 'Please enter a character',
    }
  },   
  text: {
    type: Array,
  },
  removed: {
    type: Array,
  },
  createdAt: { type: Date, default: Date.now }
})

/**
 * Expose `History` model
 */
module.exports = mongoose.model('History', historySchema)