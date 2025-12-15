const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // This line connects to the URL defined in your .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Stop the app if DB fails to connect
    }
};

module.exports = connectDB;