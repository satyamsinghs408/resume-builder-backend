const mongoose = require('mongoose');

const resumeSchema = mongoose.Schema({
    // --- THIS SECTION IS CRITICAL ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // --------------------------------
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    
    experience: [{
        title: String,
        company: String,
        description: String
    }],

    education: [{
        school: String,
        degree: String,
        year: String
    }]

}, {
    timestamps: true 
});

module.exports = mongoose.model('Resume', resumeSchema);