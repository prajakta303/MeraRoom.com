// models/BookingRequest.js
const mongoose = require('mongoose');

const BookingRequestSchema = new mongoose.Schema({
    seeker: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Refers to your User model
        required: [true, 'Seeker ID is required']
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Refers to your User model (the owner)
        required: [true, 'Owner ID is required']
    },
    accommodation: {
        type: mongoose.Schema.ObjectId,
        ref: 'Accommodation', // Refers to your Accommodation model
        required: [true, 'Accommodation ID is required']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'booked', 'living', 'cancelled_by_seeker', 'cancelled_by_owner'],
        default: 'pending',
    },
    messageFromSeeker: { // Optional message from seeker during request
        type: String,
        trim: true,
        maxlength: 500
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    // Timestamps for status changes
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    bookedAt: { type: Date }, // Could be same as acceptedAt, or a separate step
    livingFromDate: { type: Date },
    cancelledAt: { type: Date }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Prevent duplicate pending requests from the same seeker for the same accommodation
BookingRequestSchema.index({ seeker: 1, accommodation: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'pending' } // Only enforce uniqueness for pending requests
});
BookingRequestSchema.index({ seeker: 1, accommodation: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'accepted' } // Only one accepted request per user per accommodation
});
BookingRequestSchema.index({ seeker: 1, accommodation: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'booked' }
});
BookingRequestSchema.index({ seeker: 1, accommodation: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'living' }
});


module.exports = mongoose.model('BookingRequest', BookingRequestSchema);