// controllers/bookingController.js
const BookingRequest = require('../models/BookingRequest');
const Accommodation = require('../models/Accommodation');
const User = require('../models/User'); // May not be strictly needed if only using req.user
const ErrorResponse = require('../utils/errorResponse'); // Adjust path if your utils is elsewhere
const asyncHandler = require('../middleware/asyncHandler'); // Adjust path if your middleware is elsewhere

// @desc      Create a new booking request
// @route     POST /api/v1/bookings/request
// @access    Private (Seeker only)
exports.createBookingRequest = asyncHandler(async (req, res, next) => {
    // Seeker ID comes from the protect middleware
    const seekerId = req.user.id;

    // Get accommodationId and optional message from the request body
    const { accommodationId, messageFromSeeker } = req.body;

    if (!accommodationId) {
        return next(new ErrorResponse('Accommodation ID is required', 400));
    }

    // Find the accommodation to get the owner ID and verify it exists
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
        return next(new ErrorResponse(`Accommodation not found with id of ${accommodationId}`, 404));
    }
    const ownerId = accommodation.owner; // This is the Owner's User ID

    // Check if seeker is trying to book their own property
    if (seekerId === ownerId.toString()) {
        return next(new ErrorResponse('You cannot book your own property', 400));
    }

    // Check for existing active request for this accommodation by this seeker
    const existingActiveRequest = await BookingRequest.findOne({
        seeker: seekerId,
        accommodation: accommodationId,
        status: { $in: ['pending', 'accepted', 'booked', 'living'] }
    });

    if (existingActiveRequest) {
        return next(new ErrorResponse(`You already have an active request or booking (status: ${existingActiveRequest.status}) for this accommodation.`, 400));
    }

    // Create the booking request document
    const bookingRequest = await BookingRequest.create({
        seeker: seekerId,
        owner: ownerId,
        accommodation: accommodationId,
        messageFromSeeker: messageFromSeeker // Will be undefined if not provided, which is fine
    });

    res.status(201).json({
        success: true,
        data: bookingRequest,
        message: 'Booking request submitted successfully. The owner will be notified.'
    });
    // TODO: Implement actual notification to owner (e.g., via email, in-app notification system)
});

// @desc      Get seeker's active booking request for a specific accommodation
// @route     GET /api/v1/bookings/my-request/:accommodationId
// @access    Private (Seeker only)
exports.getMyBookingRequestForAccommodation = asyncHandler(async (req, res, next) => {
    const accommodationId = req.params.accommodationId;
    const seekerId = req.user.id; // From protect middleware

    const existingRequest = await BookingRequest.findOne({
        seeker: seekerId,
        accommodation: accommodationId,
        status: { $in: ['pending', 'accepted', 'booked', 'living'] } // Active statuses
    }).sort({ createdAt: -1 }); // Get the most recent one if multiple somehow exist

    if (!existingRequest) {
        // Send success:true and data:null if no active request is found.
        // This allows the frontend to know the check was successful.
        return res.status(200).json({
            success: true,
            data: null,
            message: 'No active booking request found for this accommodation by the current user.'
        });
    }
    res.status(200).json({ success: true, data: existingRequest });
});


// Add more controller functions here later for owner actions and seeker management of requests
// exports.getOwnerBookingRequests = asyncHandler(async (req, res, next) => { /* ... */ });
// exports.acceptBookingRequest = asyncHandler(async (req, res, next) => { /* ... */ });