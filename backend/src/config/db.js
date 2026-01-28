const mongoose = require('mongoose');

const connectDB = async (retries = 6) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    if (retries > 0) {
      console.log(`Retrying DB connection... (${retries} left)`);
      setTimeout(() => connectDB(retries - 1), 2000);
    } else {
      console.error('DB connection failed after retries.');
      throw err; // Throw error so server.js catches it or process exits
    }
  }
};

module.exports = connectDB;
