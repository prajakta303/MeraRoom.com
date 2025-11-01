// server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const colors = require('colors'); // Optional: for colored console logs
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config({ path: './.env' }); // Ensure path is correct

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const accommodationRoutes = require('./routes/accommodationRoutes');
const userRoutes = require('./routes/userRoutes'); // If using
const bookingRoutes = require('./routes/bookingRoutes'); // <<< ADD THIS LINE

const app = express();

// --- Middleware ---

// Enable CORS - Allow both React frontend (localhost:3000) and any other needed origins
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:3000', 'https://meraroom-frontend.vercel.app'],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

// Body parser - for JSON data
app.use(express.json());
// Body parser - for Form data (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// --- Mount Routers ---
// Good practice to version your API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accommodations', accommodationRoutes);
app.use('/api/v1/users', userRoutes); // If using
app.use('/api/v1/bookings', bookingRoutes); // <<< ADD THIS LINE

// --- Serve Static Files (Uploaded Images) ---
// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`Serving static files from: ${path.join(__dirname, 'uploads')}`);

// --- Error Handler Middleware (must be LAST middleware) ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
    )
);

// Handle unhandled promise rejections (e.g., DB connection errors)
process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`.red);
    server.close(() => process.exit(1));
});
