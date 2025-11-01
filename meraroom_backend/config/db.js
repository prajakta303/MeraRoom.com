// config/db.js
const mongoose = require('mongoose');
const colors = require('colors'); // Optional: for colored console output

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Mongoose 6 doesn't need these anymore, but good practice if using older versions:
            // useCreateIndex: true,
            // useFindAndModify: false
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold); // Using optional 'colors' package
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`.red.bold);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;