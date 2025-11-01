// routes/authRoutes.js
const express = require('express');
const {
    registerSeeker,
    registerOwner,
    login,
    getMe,
    logout,
    // Add updatePassword, forgotPassword controllers later if needed
} = require('../controllers/authController');
const { updateMyDetails } = require('../controllers/userController'); // User detail update can be here

const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const uploadHandler = require('../middleware/uploadMiddleware'); // Use the smart handler

const router = express.Router();

// Seeker Registration Validation
const seekerValidation = [
    body('fullName', 'Full name is required').notEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('phone', 'Please include a valid 10-digit phone number').matches(/^[6-9]\d{9}$/),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('confirmPassword').custom((value, { req }) => {
         if (value !== req.body.password) {
             throw new Error('Passwords do not match');
         }
         return true;
     }),
    body('hometown', 'Hometown is required').notEmpty(),
    body('userType', 'User type (student/working) is required').isIn(['student', 'working']),
     // Conditional validation (example)
     body('college').if(body('userType').equals('student')).notEmpty().withMessage('College is required for students'),
     body('company').if(body('userType').equals('working')).notEmpty().withMessage('Company is required for working professionals'),
     body('fatherName', "Father's name is required").notEmpty(),
     body('fatherContact', "Father's contact number is required").matches(/^[6-9]\d{9}$/),
     // Add more validations for other fields...
];

// Owner Registration Validation (Simplified example - add all fields)
const ownerValidation = [
     // Owner Info
    body('ownerName', 'Owner name is required').notEmpty(),
    body('ownerEmail', 'Please include a valid owner email').isEmail().normalizeEmail(),
    body('ownerPhone', 'Please include a valid 10-digit owner phone number').matches(/^[6-9]\d{9}$/),
    body('ownerPassword', 'Password must be at least 6 characters').isLength({ min: 6 }),
     body('ownerConfirmPassword').custom((value, { req }) => {
         if (value !== req.body.ownerPassword) { throw new Error('Owner passwords do not match'); } return true;
     }),
     body('ownerAddress', 'Owner permanent address is required').notEmpty(),

     // Property Info (add validation for ALL required property fields)
     body('propertyType', 'Property type is required').isIn(['hostel', 'pg', 'flat', 'house', 'room']),
     body('propertyAddress', 'Property address is required').notEmpty(),
     body('propertyCity', 'Property city is required').notEmpty(),
     body('propertyLandmark', 'Property landmark is required').notEmpty(),
     body('totalRooms', 'Total rooms must be a number >= 1').isInt({ min: 1 }),
     body('propertyDescription', 'Property description is required').notEmpty().isLength({ max: 500 }),
     body('amenities').optional(),
     body('messFacility', 'Mess facility option is required').isIn(['included', 'available', 'not-available']),
     body('availableFrom', 'Availability date is required').notEmpty(),
     body('rentAmount', 'Rent amount must be a positive number').isFloat({ min: 0 }),
     body('securityDeposit', 'Security deposit must be a positive number').isFloat({ min: 0 }),
     body('preferredTenantType').optional(),
     body('agreementTerms', 'Agreement terms are required').isIn(['11-months', '6-months', '3-months', 'monthly']),
      body('termsAgreement', 'You must agree to the terms').equals('on').withMessage('Please agree to the terms and conditions'), // Checkbox value typically 'on'
];

// Login Validation
 const loginValidation = [
     body('email', 'Please include a valid email').isEmail().normalizeEmail(),
     body('password', 'Password is required').exists()
 ];


// -- Routes --
router.post('/seeker/register', uploadHandler, seekerValidation, registerSeeker); // uploadHandler might be needed if seeker uploads files
router.post('/owner/register', uploadHandler, ownerValidation, registerOwner); // Use upload middleware BEFORE validation
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe); // Get current logged in user (needs auth token)
router.get('/logout', protect, logout); // Needs auth token to know who is logging out (conceptually)

 // Update user details route (example, can be in userRoutes too)
 // Add specific validation for updatable fields
 router.put('/me/update', protect, [
      body('name').optional().notEmpty(),
      body('phone').optional().matches(/^[6-9]\d{9}$/),
      // Add other updatable field validations
 ] , updateMyDetails);


module.exports = router;