const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if DB down
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error (Retries left: ${retries}):`, err.message);
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 2000)); // Wait 2s
      return connectDB(retries - 1); // Recursive await
    } else {
      console.error('DB connection failed after retries.');
      throw err;
    }
  }
};

module.exports = connectDB;
