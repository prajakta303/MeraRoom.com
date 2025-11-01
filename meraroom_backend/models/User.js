// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['seeker', 'owner'],
        required: [true, 'User role is required'],
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },

    // --- Seeker Specific Fields ---
    hometown: {
        type: String,
        required: function() { return this.role === 'seeker'; },
    },
    userType: { // student or working
        type: String,
        enum: ['student', 'working'],
        required: function() { return this.role === 'seeker'; },
    },
    college: String,
    course: String,
    company: String,
    designation: String,
    scholarshipCertificate: String,
    fatherName: {
        type: String,
        required: function() { return this.role === 'seeker'; },
    },
    fatherContact: {
        type: String,
        required: function() { return this.role === 'seeker'; },
         match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number'],
    },
    motherName: String,
    motherContact: {
         type: String,
         match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number'],
    },
    emergencyContact: {
         type: String,
         match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number'],
    },

    // === DISTINCT PREFERENCES SECTIONS ===
    // 1. Text-based preferences from seeker registration
    registrationPreferences: {
        accommodationType: String,
        budget: String,
        preferredGender: String,
        hobbies: String,
        habits: String,
        restrictions: String,
        specialReq: String,
    },

    // 2. Icon-based living standards from the preferences page
    livingStandards: {
        type: [String], // Array of strings like 'night-owl', 'vegan'
        default: []     // Important to have a default for arrays
    },
    additional_info: { // For the textarea on the preferences page
        type: String,
        trim: true,
        maxlength: [1000, 'Additional info cannot be more than 1000 characters'],
        default: ''     // Good to have a default for strings
    },
    // === END DISTINCT PREFERENCES SECTIONS ===

    // --- Owner Specific Fields ---
    permanentAddress: {
        type: String,
        required: function() { return this.role === 'owner'; },
    },
    idProof: String,
    isVerified: {
        type: Boolean,
        default: false,
    },

    // --- Common Fields ---
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // resetPasswordToken: String,
    // resetPasswordExpire: Date,
});

// Encrypt password using bcrypt BEFORE saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);