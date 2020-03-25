/**
 * Module dependencies
 */
const mongoose = require('mongoose')
const shortid = require('shortid')

/**
 * `VerificationProject` model schema based on Mongoose schema
 */
const verificationProject = new mongoose.Schema({
    vid: {
        type: String,
        default:  shortid.generate
    },
    pid: {
        type: String,
        required: [true, 'Please enter a pid']
    },
    bid: Number,
    codderId: String,
    statusCode: String,
    amountTofix: Number,
    verificationStudentId: String
})

/**
 * Expose `VerificationProject` model
 */
module.exports = mongoose.model('VerificationProject', verificationProject)
