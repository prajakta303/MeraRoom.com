// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads'); // Go up one level from middleware/ to root
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created directory: ${uploadDir}`);
} else {
    console.log(`Uploads directory exists: ${uploadDir}`);
}


// Storage Engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save files to the uploads/ folder
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.ext
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// File Filter (Allow only images for these fields)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ErrorResponse('Error: Images Only! (jpeg, jpg, png, gif)', 400), false);
    }
};

 // File Filter for ID Proof (Allow images and PDF)
const idProofFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
         cb(new ErrorResponse('Error: Invalid ID Proof file type! (jpeg, jpg, png, pdf)', 400), false);
    }
};

// Configure Multer for different fields
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).fields([
    // Seeker specific (if needed later)
    { name: 'scholarshipCertificate', maxCount: 1 },

    // Owner specific
    { name: 'ownerIDProof', maxCount: 1 },

    // Accommodation specific
    { name: 'propertyPhotos', maxCount: 10 } // Match schema validation
]);


// Middleware function to handle potential multer errors specifically
const handleUploads = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
             // A Multer error occurred when uploading.
            console.error("Multer Error:", err);
            return next(new ErrorResponse(`File Upload Error: ${err.message}`, 400));
        } else if (err) {
             // An unknown error occurred when uploading (e.g., file filter error).
            console.error("Upload Error:", err);
             return next(err); // Pass the ErrorResponse created by the filter/etc.
        }
        // Everything went fine.
        next();
    })
};

// Custom middleware to apply file filter based on field name AFTER multer parsed fields but before fileFilter is used internally? No, use filter in multer directly.
// We need to check filters during the multer process itself. Multer doesn't easily support per-field filters in the `.fields` method directly.
// A common workaround is to handle single file types or use libraries like `multer-sharp-resizer` if complex needs arise.

// Simple Approach: Modify fileFilter check based on fieldname (might have edge cases if same field name is used differently elsewhere)
 const smartFileFilter = (req, file, cb) => {
     if (file.fieldname === 'ownerIDProof') {
         idProofFilter(req, file, cb);
     } else if (file.fieldname === 'propertyPhotos' || file.fieldname === 'scholarshipCertificate') {
         fileFilter(req, file, cb); // Use the image-only filter
     } else {
         cb(null, true); // Allow other fields if any (though unlikely with .fields setup)
     }
};

 // RE-Configure Multer using the smart filter
const smartUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: smartFileFilter // Use the combined filter
}).fields([
    { name: 'scholarshipCertificate', maxCount: 1 },
    { name: 'ownerIDProof', maxCount: 1 },
    { name: 'propertyPhotos', maxCount: 10 }
]);

 const handleSmartUploads = (req, res, next) => {
     smartUpload(req, res, function (err) {
         if (err instanceof multer.MulterError) {
             console.error("Multer Error:", err);
             return next(new ErrorResponse(`File Upload Error: ${err.message}`, 400));
         } else if (err) {
             console.error("Upload Error:", err);
             return next(err);
         }
         next();
     })
};


// Export the refined upload handler
module.exports = handleSmartUploads; // Use the smarter version