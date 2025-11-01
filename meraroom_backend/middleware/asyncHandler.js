// File: C:\Users\praja\OneDrive\Desktop\meraghar_e1\meraroom_backend\middleware\asyncHandler.js

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;