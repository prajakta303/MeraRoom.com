// routes/bookingRoutes.js
const express = require('express');

// Import the specific controller function
const { createBookingRequest, getMyBookingRequestForAccommodation } = require('../controllers/bookingController'); // Path assumes controllers/ is a sibling to routes/

// Import authentication and authorization middleware
const { protect, authorize } = require('../middleware/authMiddleware'); // Path assumes middleware/ is a sibling to routes/

const router = express.Router();

// --- Seeker Route to create a booking request ---
// Mounted at /api/v1/bookings (in server.js), so this becomes POST /api/v1/bookings/request
router.route('/request')
    .post(
        protect,                 // 1. Authenticate: Ensure user is logged in (sets req.user)
        authorize('seeker'),     // 2. Authorize: Ensure req.user.role is 'seeker'
        createBookingRequest     // 3. Handle: The actual function to process the request
    );

// --- Placeholder for a route needed by accommodation-details.js ---
// To check if the current seeker already has an active request for a specific accommodation
// GET /api/v1/bookings/my-request/:accommodationId
// router.route('/my-request/:accommodationId')
// .get(protect, authorize('seeker'), getMyBookingRequestForAccommodation); // You'd create this controller
// ... (after existing POST /request)
router.route('/my-request/:accommodationId')
    .get(protect, authorize('seeker'), getMyBookingRequestForAccommodation);

module.exports = router;