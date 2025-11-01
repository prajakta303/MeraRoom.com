// controllers/authController.js
const User = require('../models/User');
const Accommodation = require('../models/Accommodation'); // For owner registration
const ErrorResponse = require('../utils/errorResponse'); // Ensure path is correct
const { validationResult } = require('express-validator'); // If you use it for validation in routes
const asyncHandler = require('../middleware/asyncHandler'); // Ensure path is correct

// Helper function to get token from model and send response (used for login/register)
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const userResponseData = user.toObject({ virtuals: true });
    delete userResponseData.password;

    console.log("authController - sendTokenResponse - User data being sent to client (for login/register):", JSON.stringify(userResponseData, null, 2));
    res.status(statusCode).json({
        success: true,
        token,
        user: userResponseData, // Key is 'user' here
    });
};


// @desc      Register Seeker
// @route     POST /api/v1/auth/seeker/register
// @access    Public
exports.registerSeeker = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    const {
        fullName, email, phone, password, hometown, userType,
        college, course, company, designation,
        fatherName, fatherContact, motherName, motherContact, emergencyContact,
        accommodationType, budget, preferredGender, hobbies, habits, restrictions, specialReq
    } = req.body;

    console.log("authController - registerSeeker - Received FULL req.body:", JSON.stringify(req.body, null, 2));

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorResponse('User with this email already exists', 400));
    }

    let scholarshipCertificatePath = null;
    if (req.files && req.files.scholarshipCertificate && req.files.scholarshipCertificate.length > 0) {
        scholarshipCertificatePath = `/uploads/${req.files.scholarshipCertificate[0].filename}`;
    }

    const seekerRegistrationPrefsData = {
        accommodationType: accommodationType || undefined, budget: budget || undefined,
        preferredGender: preferredGender || undefined, hobbies: hobbies || undefined,
        habits: habits || undefined, restrictions: restrictions || undefined,
        specialReq: specialReq || undefined,
    };
    Object.keys(seekerRegistrationPrefsData).forEach(key => seekerRegistrationPrefsData[key] === undefined && delete seekerRegistrationPrefsData[key]);

    user = await User.create({
        role: 'seeker', name: fullName, email, phone, password, hometown, userType,
        college: userType === 'student' ? college : undefined,
        course: userType === 'student' ? course : undefined,
        company: userType === 'working' ? company : undefined,
        designation: userType === 'working' ? designation : undefined,
        scholarshipCertificate: scholarshipCertificatePath,
        fatherName, fatherContact, motherName, motherContact, emergencyContact,
        registrationPreferences: Object.keys(seekerRegistrationPrefsData).length > 0 ? seekerRegistrationPrefsData : undefined,
        livingStandards: [], additional_info: ''
    });
    console.log("authController - registerSeeker - New Seeker Created. DB Object:", JSON.stringify(user.toObject(), null, 2));
    sendTokenResponse(user, 201, res);
});


// @desc      Register Owner & their first property
exports.registerOwner = asyncHandler(async (req, res, next) => {
    // (Your existing full owner registration logic - should be fine if it worked before)
    // For brevity, this part is condensed. Ensure asyncHandler is at the function definition.
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() });}
    const { ownerName, ownerEmail, ownerPhone, ownerPassword, ownerAddress } = req.body;
    const { propertyType, propertyName, propertyAddress, propertyCity, propertyLandmark, totalRooms, currentOccupancy, propertyDescription, amenities, nearbyFacilities, transportation, messFacility, availableFrom, rentAmount, securityDeposit, otherCharges, studentDiscount, preferredTenantType, houseRules, agreementTerms } = req.body;
    let ownerUser = await User.findOne({ email: ownerEmail });
    if (ownerUser) { return next(new ErrorResponse('Owner with this email already exists', 400));}
    let ownerIDProofPath = null;
    if (!req.files || !req.files.ownerIDProof || req.files.ownerIDProof.length === 0) { return next(new ErrorResponse('Owner ID Proof is required', 400));}
    ownerIDProofPath = `/uploads/${req.files.ownerIDProof[0].filename}`;
    let propertyPhotoPaths = [];
    if (!req.files || !req.files.propertyPhotos || req.files.propertyPhotos.length === 0) { return next(new ErrorResponse('At least one property photo is required', 400));}
    propertyPhotoPaths = req.files.propertyPhotos.map(file => `/uploads/${file.filename}`);
    ownerUser = await User.create({ role: 'owner', name: ownerName, email: ownerEmail, phone: ownerPhone, password: ownerPassword, permanentAddress: ownerAddress, idProof: ownerIDProofPath, registrationPreferences:{}, livingStandards:[], additional_info:''});
    let processedAmenities = []; if (amenities) { if (Array.isArray(amenities)) processedAmenities = amenities; else if (typeof amenities === 'string') processedAmenities = [amenities];}
    let processedTenantTypeArr = []; if (preferredTenantType) { if(Array.isArray(preferredTenantType)) processedTenantTypeArr = preferredTenantType; else if (typeof preferredTenantType === 'string') processedTenantTypeArr = [preferredTenantType];}
    await Accommodation.create({ owner: ownerUser._id, propertyType, propertyName, address: propertyAddress, city: propertyCity, landmark: propertyLandmark, totalRooms: parseInt(totalRooms) || 0, currentOccupancy: parseInt(currentOccupancy || '0'), photos: propertyPhotoPaths, description: propertyDescription, amenities: processedAmenities, preferredTenantType: processedTenantTypeArr, nearbyFacilities, transportation, messFacility, availableFrom: availableFrom ? new Date(availableFrom) : undefined, rentAmount: parseFloat(rentAmount) || 0, securityDeposit: parseFloat(securityDeposit) || 0, otherCharges, studentDiscount, houseRules, agreementTerms });
    sendTokenResponse(ownerUser, 201, res);
});

// @desc      Login user
exports.login = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { email, password } = req.body;
    if (!email || !password) { return next(new ErrorResponse('Please provide an email and password', 400));}
    const user = await User.findOne({ email }).select('+password');
    if (!user) { return next(new ErrorResponse('Invalid credentials', 401)); }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) { return next(new ErrorResponse('Invalid credentials', 401));}
    console.log("authController - Login - User found and password matched:", user._id);
    sendTokenResponse(user, 200, res); // Uses sendTokenResponse which sends user under 'user' key
});

// @desc      Get current logged in user details
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('User not authenticated (no req.user)', 401));
    }

    const userFromDb = await User.findById(req.user.id); // Fetch fresh data

    if (!userFromDb) {
        return next(new ErrorResponse(`User with ID ${req.user.id} not found in database.`, 404));
    }

    const userPayload = userFromDb.toObject({ virtuals: true }); // Convert to plain object
    delete userPayload.password; // Ensure password is not sent

    // --- CRITICAL DEBUG LOG ---
    console.log("authController - /auth/me - User data payload being sent to client:", JSON.stringify(userPayload, null, 2));

    // --- MODIFIED RESPONSE STRUCTURE ---
    res.status(200).json({
        success: true,
        data: userPayload // <<< SEND USER OBJECT UNDER 'data' KEY
    });
});

// @desc      Log user out
exports.logout = asyncHandler(async (req, res, next) => {
     res.status(200).json({
         success: true,
         data: {},
         message: 'Logged out successfully (Client should clear token)',
     });
});

// (Ensure sendTokenResponse is defined as you provided it - used for login/register)