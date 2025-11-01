// routes/accommodationRoutes.js
const express = require('express');
const {
    getAccommodations,
    getAccommodation,
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
    getMyAccommodations
} = require('../controllers/accommodationController');

const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadHandler = require('../middleware/uploadMiddleware'); // Needed for create/update

const router = express.Router();

// Validation for Creating/Updating Accommodation (separate from owner reg)
const accommodationValidation = [
    body('propertyType', 'Property type is required').isIn(['hostel', 'pg', 'flat', 'house', 'room']),
     body('propertyAddress', 'Property address is required').notEmpty(),
     body('city', 'Property city is required').notEmpty(),
     body('landmark', 'Property landmark is required').notEmpty(),
     body('totalRooms', 'Total rooms must be a number >= 1').isInt({ min: 1 }),
     body('propertyDescription', 'Property description is required').notEmpty().isLength({ max: 500 }),
     body('amenities').optional().isArray().withMessage('Amenities should be an array'),
     body('messFacility', 'Mess facility option is required').isIn(['included', 'available', 'not-available']),
     body('availableFrom', 'Availability date is required').isISO8601().toDate(),
     body('rentAmount', 'Rent amount must be a positive number').isFloat({ min: 0 }),
     body('securityDeposit', 'Security deposit must be a positive number').isFloat({ min: 0 }),
     body('preferredTenantType').optional().isArray(),
     body('agreementTerms', 'Agreement terms are required').isIn(['11-months', '6-months', '3-months', 'monthly']),
];

router.route('/my')
    .get(protect, authorize('owner'), getMyAccommodations);

router.route('/')
    .get(getAccommodations) // Publicly accessible
    .post(protect, authorize('owner'), uploadHandler, accommodationValidation, createAccommodation); // Only logged-in owners can create

router.route('/:id')
    .get(getAccommodation) // Publicly accessible
    .put(protect, authorize('owner'), uploadHandler, accommodationValidation, updateAccommodation) // Only owner who owns it
    .delete(protect, authorize('owner'), deleteAccommodation); // Only owner who owns it

module.exports = router;