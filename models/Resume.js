const mongoose = require('mongoose');

const resumeSchema = mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    
    // Existing Experience Array
    experience: [{
        title: String,
        company: String,
        description: String
    }],

    // --- NEW: Education Array ---
    education: [{
        school: String,
        degree: String,
        year: String
    }]
    // ----------------------------

}, {
    timestamps: true 
});

module.exports = mongoose.model('Resume', resumeSchema);