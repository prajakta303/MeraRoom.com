// controllers/userController.js
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');

// @desc      Update user details (General Profile Update - Excludes icon-based preferences)
// @route     PUT /api/v1/users/me/update
// @access    Private
exports.updateMyDetails = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('User not authenticated', 401));
    }
    const userId = req.user.id;

    const fieldsToUpdate = {};
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
    if (req.body.hometown !== undefined) fieldsToUpdate.hometown = req.body.hometown;
    if (req.body.userType !== undefined) fieldsToUpdate.userType = req.body.userType;
    if (req.body.college !== undefined) fieldsToUpdate.college = req.body.college;
    if (req.body.course !== undefined) fieldsToUpdate.course = req.body.course;
    if (req.body.company !== undefined) fieldsToUpdate.company = req.body.company;
    if (req.body.designation !== undefined) fieldsToUpdate.designation = req.body.designation;
    if (req.body.fatherName !== undefined) fieldsToUpdate.fatherName = req.body.fatherName;
    if (req.body.fatherContact !== undefined) fieldsToUpdate.fatherContact = req.body.fatherContact;
    if (req.body.motherName !== undefined) fieldsToUpdate.motherName = req.body.motherName;
    if (req.body.motherContact !== undefined) fieldsToUpdate.motherContact = req.body.motherContact;
    if (req.body.emergencyContact !== undefined) fieldsToUpdate.emergencyContact = req.body.emergencyContact;

    // Handle nested registrationPreferences (text-based from initial form)
    if (req.body.registrationPreferences && typeof req.body.registrationPreferences === 'object') {
        const userToUpdate = await User.findById(userId); // Fetch current user for merging
        const currentRegPrefs = userToUpdate.registrationPreferences || {};
        const newRegPrefsFromRequest = req.body.registrationPreferences;
        
        // Construct the update object for registrationPreferences using dot notation for Mongoose
        // This ensures only provided sub-fields are updated without overwriting the whole object.
        for (const key in newRegPrefsFromRequest) {
            if (Object.prototype.hasOwnProperty.call(newRegPrefsFromRequest, key) && newRegPrefsFromRequest[key] !== undefined) {
                fieldsToUpdate[`registrationPreferences.${key}`] = newRegPrefsFromRequest[key];
            }
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return next(new ErrorResponse('No valid fields provided for update', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: fieldsToUpdate }, {
        new: true,
        runValidators: true,
    }).select('-password');

    if (!updatedUser) {
        return next(new ErrorResponse('User not found or update failed', 404));
    }

    // Crucially, send back the FULL updated user object so localStorage can be updated
    res.status(200).json({
        success: true,
        data: updatedUser, // Send back full user to update localStorage on frontend
        message: 'Profile details updated successfully.'
    });
});


// @desc    Update icon-based living standards and additional info
// @route   PUT /api/v1/users/preferences
// @access  Private
exports.updateUserPreferences = asyncHandler(async (req, res, next) => {
    const { selectedLivingStandards, additional_info } = req.body; // Expecting 'selectedLivingStandards'

    if (selectedLivingStandards !== undefined && !Array.isArray(selectedLivingStandards)) {
        return next(new ErrorResponse('Living standards selection must be an array', 400));
    }
    if (additional_info !== undefined && typeof additional_info !== 'string') {
        return next(new ErrorResponse('Additional info must be a string', 400));
    }
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('User not authenticated or user ID not found', 401));
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }

    if (selectedLivingStandards !== undefined) {
        user.livingStandards = selectedLivingStandards;
    }
    if (additional_info !== undefined) {
        user.additional_info = additional_info;
    }

    await user.save();

    // Send back the specific fields that were updated for this operation
    res.status(200).json({
        success: true,
        data: {
            livingStandards: user.livingStandards,
            additional_info: user.additional_info
        },
        message: 'Living Standards and additional info updated successfully'
    });
});

// @desc    Get current logged in user's icon-based living standards and additional info
// @route   GET /api/v1/users/preferences
// @access  Private
exports.getUserPreferences = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('User not authenticated or user ID not found', 401));
    }
    const userId = req.user.id;
    const user = await User.findById(userId).select('livingStandards additional_info');

    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }
    res.status(200).json({ success: true, data: user });
});