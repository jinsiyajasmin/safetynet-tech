const mongoose = require('mongoose');

const connectDB = async (retries = 6) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    if (retries > 0) setTimeout(() => connectDB(retries - 1), 2000);
    else console.warn('DB not connected — continuing for dev (remove this in prod)');
  }
};

module.exports = connectDB;
