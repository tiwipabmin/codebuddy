/**
 * Module dependencies
 */
const mongoose = require("mongoose");
const shortid = require("shortid");

/**
 * `Project Session` model schema base on Mongoose schema
 */
const projectSessionSchema = new mongoose.Schema({
  psid: {
    type: String,
    default: shortid.generate,
  },
  uid: String,
  pid: String,
  dwellingTime: { type: Number, default: 0 },
  activeTime: { type: Number, default: 0 },
  coderTime: { type: Number, default: 0 },
  noOfManualRoleSwitching: { type: Number, default: 0 },
  noOfAutomaticRoleSwitching: { type: Number, default: 0 },
  reviewerTime: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: Date.now },
  noOfActiveUser: Number,
});

/**
 * Expose `Project Session` model
 */
module.exports = mongoose.model("ProjectSession", projectSessionSchema);
