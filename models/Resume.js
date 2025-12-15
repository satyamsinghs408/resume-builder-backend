const mongoose = require('mongoose');

const resumeSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    // We can add complex fields like Education/Experience later
}, {
    timestamps: true 
});

module.exports = mongoose.model('Resume', resumeSchema);