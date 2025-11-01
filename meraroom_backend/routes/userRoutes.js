// routes/userRoutes.js
const express = require('express');

// Import controllers
const {
    updateMyDetails,        // For general profile updates
    updateUserPreferences,  // For specific preference updates
    getUserPreferences      // For fetching preferences
    // Import other user controllers you might have (e.g., for admin actions)
} = require('../controllers/userController'); // Ensure this path is correct

// Import Authentication Middleware - REQUIRE IT ONLY ONCE
const { protect } = require('../middleware/authMiddleware'); // Ensure this path is correct

// Import validation if needed for specific routes (example for updateMyDetails)
const { check } = require('express-validator'); // If you add validation checks


// Initialize router
const router = express.Router();

// --- User Preference Routes ---
router.route('/preferences')
    .get(protect, getUserPreferences)       // Get current user's preferences
    .put(protect, updateUserPreferences);    // Update current user's preferences

// --- User Profile Update Route ---
// Define any validation rules needed for updating general details
const updateDetailsValidation = [ // Example validation - adapt as needed
    check('name', 'Name is required').optional().not().isEmpty().trim(),
    check('phone', 'Please provide a valid phone number').optional().isMobilePhone('any'), // Example - uses 'any' locale
    check('hometown', 'Hometown should be text').optional().isString().trim(),
    check('permanentAddress', 'Permanent address should be text').optional().isString().trim()
    // Add more checks for college, company etc. if you allow them to be updated here
];

router.route('/me/update') // Route for logged-in user to update their own basic details
    .put(protect, updateDetailsValidation, updateMyDetails);


// --- Add other user-related routes here if necessary ---
// Example: An admin getting all users (requires authorization middleware as well)
// const { authorize } = require('../middleware/authMiddleware');
// router.route('/').get(protect, authorize('admin'), getAllUsers); // Assuming an admin controller


module.exports = router;