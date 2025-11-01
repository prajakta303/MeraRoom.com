// models/Accommodation.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const AccommodationSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to the owner (User model)
        required: true,
    },
    propertyType: {
        type: String,
        required: [true, 'Please select property type'],
        enum: ['hostel', 'pg', 'flat', 'house', 'room'],
    },
    propertyName: {
        type: String,
        trim: true,
        // Not strictly required, but good to have
    },
    address: {
        type: String,
        required: [true, 'Please add property address'],
    },
    city: {
        type: String,
        required: [true, 'Please add city'],
        trim: true,
    },
    landmark: {
        type: String,
        required: [true, 'Please add nearest landmark'],
        trim: true,
    },
    totalRooms: {
        type: Number,
        required: [true, 'Please add total available rooms'],
        min: 1,
    },
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0,
    },
    photos: {
        type: [String], // Array of image file paths/URLs
        required: [true, 'Please upload at least one property photo'],
        validate: [arrayLimit, '{PATH} exceeds the limit of 10 photos']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    amenities: [String], // e.g., ['wifi', 'food', 'ac']
    nearbyFacilities: String,
    transportation: String,
    messFacility: {
        type: String,
        required: true,
        enum: ['included', 'available', 'not-available'],
    },
    availableFrom: {
        type: Date,
        required: [true, 'Please specify availability date'],
    },
    rentAmount: {
        type: Number,
        required: [true, 'Please add rent amount per month'],
        min: 0,
    },
    securityDeposit: {
        type: Number,
        required: [true, 'Please add security deposit amount'],
        min: 0,
    },
    otherCharges: String,
    studentDiscount: String,
    preferredTenantType: [String], // e.g., ['student', 'female']
    houseRules: String,
    agreementTerms: {
        type: String,
        required: true,
        enum: ['11-months', '6-months', '3-months', 'monthly'],
    },
    slug: String, // URL-friendly version of name/location
    isAvailable: { // Automatically calculate based on occupancy/rooms? Or manual toggle?
        type: Boolean,
        default: true,
    },
     // Example: Average rating (can be calculated later)
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating can not be more than 5']
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

function arrayLimit(val) {
    return val.length <= 10; // Limit to 10 photos max
}

// Create accommodation slug from the propertyName or address
AccommodationSchema.pre('save', function (next) {
    let baseSlug = this.propertyName ? slugify(this.propertyName, { lower: true }) : slugify(this.address.substring(0, 30), { lower: true });
    this.slug = `${baseSlug}-${this.city ? slugify(this.city, {lower: true}) : ''}-${this._id.toString().slice(-5)}`; // Add city and part of ID for uniqueness
    next();
});

// Cascade delete logic can be added here if needed (e.g., delete reviews if accommodation is deleted)

module.exports = mongoose.model('Accommodation', AccommodationSchema);