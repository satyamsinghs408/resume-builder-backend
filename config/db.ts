import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        // This line connects to the URL defined in your .env file
        const conn = await mongoose.connect(process.env.MONGO_URI as string);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Stop the app if DB fails to connect
    }
};

export default connectDB;
