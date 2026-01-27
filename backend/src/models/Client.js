// src/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: null }, // store URL or null
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// You can add indexes here if needed, e.g. unique name:
clientSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);
