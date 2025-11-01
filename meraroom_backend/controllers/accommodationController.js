// controllers/accommodationController.js
const Accommodation = require('../models/Accommodation');
const User = require('../models/User'); // To populate owner info
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

// @desc      Get all accommodations (with filtering, sorting, pagination)
// @route     GET /api/v1/accommodations
// @access    Public
exports.getAccommodations = async (req, res, next) => {
    try { // **** Start Try/Catch block ****

        let query;

        // 1. Base Query Object from URL parameters (excluding reserved words)
        const reqQuery = { ...req.query };
        // Add ALL specific filter names here to remove them from base filtering
        const removeFields = ['select', 'sort', 'page', 'limit', 'location', 'type', 'budget', 'roommatePref'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Handle advanced filtering operators ($gt, etc.) if used in base query
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Initial query building - start with base filters if any
        query = Accommodation.find(JSON.parse(queryStr));

        // 2. Apply Specific Filters sequentially

        // Location Search (Case-insensitive regex on multiple fields)
        if (req.query.location && req.query.location.trim() !== '') {
            const locationRegex = new RegExp(req.query.location.trim(), 'i'); // 'i' for case-insensitive
            // Apply the location filter using $or
            query = query.find({
                $or: [
                    { city: locationRegex },
                    { landmark: locationRegex },
                    { address: locationRegex },
                    { propertyName: locationRegex } // **** Added propertyName search ****
                ]
            });
            // No need to delete reqQuery.location now, we handle specific fields directly
        }

        // Type Filter
        if (req.query.type) {
            query = query.where('propertyType').equals(req.query.type);
        }

        // Budget Filter (Improved Handling)
        if (req.query.budget) {
            const budgetVal = req.query.budget;
            if (budgetVal === '20000+') {
                query = query.where('rentAmount').gte(20000);
            } else if (budgetVal.includes('-')) {
                const [minStr, maxStr] = budgetVal.split('-');
                const min = parseInt(minStr);
                const max = parseInt(maxStr);
                // Apply range only if both min and max are valid numbers
                if (!isNaN(min) && !isNaN(max)) {
                    query = query.where('rentAmount').gte(min).lte(max);
                }
                 // Check the specific frontend options to see if '0-5000' needs gte(0) or just lte(5000)
                 else if (isNaN(min) && !isNaN(max) && minStr === '0') { // Handles '0-XXXX' case like 'Under XXXX'
                      query = query.where('rentAmount').lte(max);
                 }
                 else {
                     console.warn(`Skipping invalid budget range format: ${budgetVal}`);
                 }
            }
            // Could add else {} here to handle single numeric budget if needed
        }

        // Roommate Preference Filter (Placeholder - **Requires Schema Modification**)
        if (req.query.roommatePref) {
            const pref = req.query.roommatePref;
            console.log(`Applying Roommate Pref filter (requires schema): ${pref}`); // Logging
             if (pref === 'female' || pref === 'male') {
                  // Example: Modify query based on an 'allowedGender' field in your Schema
                  // query = query.where('allowedGender').in([pref, 'any']); // Replace 'allowedGender' and 'any' as needed
                  console.warn(`Filtering by '${pref}' preference requires an 'allowedGender' (or similar) field in the Accommodation schema.`);
             } else if (pref === 'student' || pref === 'working') {
                  // Example: Modify based on 'preferredTenantType' array in your Schema
                  // Ensure case-insensitivity if necessary
                  query = query.where('preferredTenantType').in([new RegExp(pref, 'i')]); // Check if 'preferredTenantType' contains student/working
                  console.warn(`Filtering by '${pref}' preference uses the 'preferredTenantType' field.`);
             } else if (pref === 'upsc') {
                // Example: Search description for 'upsc' keyword
                 query = query.find({ description: new RegExp('upsc', 'i')}); // Basic keyword search
                  console.warn(`Filtering by '${pref}' preference searches the description field.`);
             }
         }

         // **** Crucial: Filter by Availability ****
         // ASSUMES you have added { isAvailable: { type: Boolean, default: true } } to your AccommodationSchema
         query = query.where('isAvailable').equals(true);


        // 3. --- Count Documents *AFTER* All Filters are Applied ---
        // Clone the query *before* adding sort/skip/limit/populate for accurate counting
        const countQuery = query.clone(); // Mongoose query objects are mutable
        const total = await countQuery.countDocuments();
        // Alternatively, use the filter object: const total = await Accommodation.countDocuments(query.getFilter());


        // 4. Select Fields (applied to the original query)
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // 5. Sort (applied to the original query)
        if (req.query.sort) {
            let sortBy = req.query.sort;
             // Special case for frontend price sort values
            if(sortBy === 'price-low') sortBy = 'rentAmount';
            if(sortBy === 'price-high') sortBy = '-rentAmount';
            if(sortBy === 'newest') sortBy = '-createdAt';
            // 'rating' needs 'averageRating' field, 'recommended' is handled by default sort
            if(sortBy === 'rating') sortBy = '-averageRating';

            // Default sort logic can be handled better here if needed
            if(sortBy !== 'recommended'){ // Only apply sort if it's not the default case
                 query = query.sort(sortBy.split(',').join(' '));
             } else {
                 query = query.sort('-createdAt -averageRating'); // Default Recommended sort
             }
        } else {
            query = query.sort('-createdAt -averageRating'); // Default sort if not provided
        }

        // 6. Pagination (applied to the original query)
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 6; // Match frontend listingsPerPage
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit; // Used only for pagination object calculation

        query = query.skip(startIndex).limit(limit);

        // 7. Populate Owner Details
        query = query.populate({
            path: 'owner',
            select: 'name isVerified' // Only expose needed owner info publicly
        });

        // Execute the final Query
        const accommodations = await query;

        // Pagination result object creation
        const pagination = {};
        if (endIndex < total) { pagination.next = { page: page + 1, limit }; }
        if (startIndex > 0) { pagination.prev = { page: page - 1, limit }; }
         pagination.currentPage = page;
         pagination.totalPages = Math.ceil(total / limit);
         pagination.totalDocs = total;


        res.status(200).json({
            success: true,
            count: accommodations.length, // Count for the current page
            pagination,
            data: accommodations,
        });

    } catch (err) { // **** End Try/Catch block ****
        console.error("Error in getAccommodations:", err);
        next(err); // Pass error to the central error handler
    }
};

// =======================================================
// Other Functions (getAccommodation, create, update, delete, getMyAccommodations)
// Ensure these existing functions are still present below
// =======================================================

// @desc      Get single accommodation
// @route     GET /api/v1/accommodations/:id
// @access    Public
exports.getAccommodation = async (req, res, next) => {
    try {
        const accommodation = await Accommodation.findById(req.params.id).populate({
             path: 'owner',
             select: 'name email phone isVerified' // Provide more details when viewing one listing
        });

        if (!accommodation) {
            return next(
                new ErrorResponse(`Accommodation not found with id of ${req.params.id}`, 404)
            );
        }

        res.status(200).json({ success: true, data: accommodation });
    } catch (err) {
        next(err);
    }
};

// @desc      Create new accommodation (Separate from registration)
// @route     POST /api/v1/accommodations
// @access    Private (Owner Only)
exports.createAccommodation = async (req, res, next) => {
     // Add validation here if needed (e.g., using express-validator in routes)
     // const errors = validationResult(req); if (!errors.isEmpty()) ...

    // Set owner from logged-in user
    req.body.owner = req.user.id;

    // Handle potential file uploads from req.files if adding photos here
    // Example assumes photos are required and came through middleware
    let propertyPhotoPaths = [];
     if (req.files && req.files.propertyPhotos) {
         propertyPhotoPaths = req.files.propertyPhotos.map(file => `/uploads/${file.filename}`);
     } else {
         // Decide if photos are optional when *adding* a new property separately
         // return next(new ErrorResponse('Property photos are required', 400));
         console.warn('No property photos uploaded for createAccommodation');
     }
      // Always add photos field, even if empty, if schema expects it
      req.body.photos = propertyPhotoPaths;


     // Process checkbox data to ensure arrays (copy logic from registerOwner if needed)
     let processedAmenities = [];
     if (req.body.amenities) { /* ... normalize ... */ processedAmenities = Array.isArray(req.body.amenities) ? req.body.amenities : [req.body.amenities]; }
     let processedTenantType = [];
     if (req.body.preferredTenantType) { /* ... normalize ... */ processedTenantType = Array.isArray(req.body.preferredTenantType) ? req.body.preferredTenantType : [req.body.preferredTenantType]; }
     req.body.amenities = processedAmenities;
     req.body.preferredTenantType = processedTenantType;


    try {
         // Add other required fields processing (dates, numbers) if necessary
          req.body.availableFrom = new Date(req.body.availableFrom);
          req.body.rentAmount = parseFloat(req.body.rentAmount);
          req.body.securityDeposit = parseFloat(req.body.securityDeposit);
          req.body.totalRooms = parseInt(req.body.totalRooms);
          req.body.currentOccupancy = parseInt(req.body.currentOccupancy || '0');


         // Set default isAvailable on creation
          req.body.isAvailable = true; // Assuming new listings start as available

         const accommodation = await Accommodation.create(req.body); // Pass entire body

        res.status(201).json({
            success: true,
            data: accommodation,
        });
    } catch (err) {
        next(err);
    }
};

// @desc      Update accommodation
// @route     PUT /api/v1/accommodations/:id
// @access    Private (Owner Only)
exports.updateAccommodation = async (req, res, next) => {
     // Add validation here if needed
     // const errors = validationResult(req); if (!errors.isEmpty()) ...

    try {
        let accommodation = await Accommodation.findById(req.params.id);

        if (!accommodation) {
            return next(
                new ErrorResponse(`Accommodation not found with id of ${req.params.id}`, 404)
            );
        }

        // Authorize owner
        if (accommodation.owner.toString() !== req.user.id) {
             console.warn(`Auth Fail: User ${req.user.id} tried to update property ${req.params.id} owned by ${accommodation.owner.toString()}`);
            return next( new ErrorResponse(`User not authorized to update this accommodation`, 401));
        }

        // Handle new photo uploads (simple replacement example)
        if (req.files && req.files.propertyPhotos) {
            console.log(`Updating photos for accommodation ${req.params.id}`);
            // TODO: Delete old photos from filesystem before updating paths in DB
            const newPhotos = req.files.propertyPhotos.map(file => `/uploads/${file.filename}`);
            req.body.photos = newPhotos;
        }

        // Normalize array fields if they are present in the update request body
         if (req.body.amenities !== undefined) {
             req.body.amenities = Array.isArray(req.body.amenities) ? req.body.amenities : (req.body.amenities ? [req.body.amenities] : []);
         }
         if (req.body.preferredTenantType !== undefined) {
             req.body.preferredTenantType = Array.isArray(req.body.preferredTenantType) ? req.body.preferredTenantType : (req.body.preferredTenantType ? [req.body.preferredTenantType] : []);
         }
         // Normalize numbers/dates if they might come as strings
          if (req.body.rentAmount) req.body.rentAmount = parseFloat(req.body.rentAmount);
          if (req.body.securityDeposit) req.body.securityDeposit = parseFloat(req.body.securityDeposit);
          // ...etc for other numbers/dates ...


        // Update the accommodation
        accommodation = await Accommodation.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document
            runValidators: true, // Run schema validators on update
        });

        res.status(200).json({ success: true, data: accommodation });
    } catch (err) {
        next(err);
    }
};


// @desc      Delete accommodation
// @route     DELETE /api/v1/accommodations/:id
// @access    Private (Owner Only)
exports.deleteAccommodation = async (req, res, next) => {
    try {
        const accommodation = await Accommodation.findById(req.params.id);

        if (!accommodation) {
            return next(
                new ErrorResponse(`Accommodation not found with id of ${req.params.id}`, 404)
            );
        }

        // Authorize owner
        if (accommodation.owner.toString() !== req.user.id) {
            return next(
                new ErrorResponse(`User not authorized to delete this accommodation`, 401)
            );
        }

        // TODO: Implement deletion of associated files (photos) from server's /uploads folder
        // Use the 'fs' module (require('fs').promises)
        // Example (needs error handling):
        /*
        if (accommodation.photos && accommodation.photos.length > 0) {
             const fs = require('fs').promises;
             const path = require('path');
             console.log(`Deleting photos for ${req.params.id}`);
             for (const photoPath of accommodation.photos) {
                 try {
                      const fullPath = path.join(__dirname, '..', photoPath); // Adjust path if needed
                      await fs.unlink(fullPath);
                      console.log(`Deleted ${fullPath}`);
                  } catch (fileErr) {
                      console.error(`Error deleting file ${photoPath}:`, fileErr);
                      // Decide if you want to continue deleting the DB record even if file deletion fails
                  }
              }
          }
        */

        await accommodation.remove(); // Use remove() to potentially trigger Mongoose 'remove' middleware

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};


// @desc      Get accommodations listed by the logged-in owner
// @route     GET /api/v1/accommodations/my
// @access    Private (Owner Only)
exports.getMyAccommodations = async (req, res, next) => {
    try {
        const accommodations = await Accommodation.find({ owner: req.user.id }).sort('-createdAt'); // Sort by newest

        // No need to check !accommodations, find returns [] if none found
        res.status(200).json({
            success: true,
            count: accommodations.length,
            data: accommodations
        });
    } catch (err) {
        console.error("Error fetching owner's accommodations:", err);
        next(new ErrorResponse('Server Error fetching your accommodations', 500));
    }
};