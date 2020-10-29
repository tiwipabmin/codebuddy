/**
 * Module dependencies
 */
const mongoose = require("mongoose");

/**
 * `Score` model schema based on Mongoose schema
 */
const scoreSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: [true, "Please enter a user id"],
  },
  pid: {
    type: String,
    required: [true, "Please enter a project id"],
  },
  score: {
    type: Number,
    required: [true, "Please fill in score"],
  },
  time: {
    type: Number,
    required: [true, "Please fill in time"],
  },
  lines_of_code: {
    type: Number,
    required: [true, "Please fill in lines of code"],
  },
  error_count: {
    type: Number,
    required: [true, "Please fill in error count"],
  },
  participation: {
    enter: Array,
    pairing: Array,
  },
  createdAt: { type: Date, default: Date.now },
});

/**
 * Expose `Score` model
 */
module.exports = mongoose.model("Score", scoreSchema);
