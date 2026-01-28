// src/controllers/clientsController.js
const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const mongoose = require('mongoose');

exports.listClients = asyncHandler(async (req, res) => {
  const { name } = req.query;
  let query = {};

  if (name) {
    // Case-insensitive search
    query.name = { $regex: new RegExp(`^${name}$`, "i") };
  }

  const clients = await Client.find(query).sort({ createdAt: -1 }).lean();
  const normalized = clients.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    logo: c.logo || null,
    createdAt: c.createdAt,
  }));
  res.json({ success: true, clients: normalized });
});

exports.createClient = asyncHandler(async (req, res) => {
  try {

    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required',
        errors: { name: 'Client name is required' },
      });
    }

    const logoUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.logo || null);

    const client = new Client({ name: name.trim(), logo: logoUrl || null });
    await client.save();

    res.status(201).json({
      success: true,
      message: 'Client created',
      client: { id: client._id.toString(), name: client.name, logo: client.logo || null },
    });
  } catch (err) {
    console.error('CREATE CLIENT ERROR:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
      stack: err.stack ? err.stack.split('\n').slice(0, 5) : undefined,
    });
  }
});
// src/controllers/clientsController.js
exports.deleteClient = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ DELETE REQUEST RECEIVED for ID:", id);

    const client = await Client.findById(id);
    if (!client) {
      console.log("❌ Client not found in DB");
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    await client.deleteOne();
    console.log("✅ Client deleted successfully:", id);

    return res.json({ success: true, message: "Client deleted successfully", id });
  } catch (err) {
    console.error("🔥 DELETE CLIENT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

exports.updateClient = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    console.log('UPDATE CLIENT - id:', id, 'body:', req.body, 'file:', req.file);

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // update name if provided (trim)
    if (typeof name === 'string' && name.trim().length) {
      client.name = name.trim();
    }

    // if a new file uploaded, build logo path and remove old file if local
    if (req.file) {
      const newLogo = `/uploads/${req.file.filename}`;

      // delete old local file if it exists and was saved under /uploads/
      if (client.logo && client.logo.startsWith('/uploads/')) {
        try {
          const uploadsRoot = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
          const filename = client.logo.split('/').pop();
          const oldPath = path.join(uploadsRoot, filename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log('Deleted old logo file:', oldPath);
          }
        } catch (err) {
          console.warn('Failed to delete old logo file', err);
        }
      }

      client.logo = newLogo;
    }

    await client.save();

    res.json({
      success: true,
      message: 'Client updated',
      client: { id: client._id.toString(), name: client.name, logo: client.logo || null },
    });
  } catch (err) {
    console.error('UPDATE CLIENT ERROR:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

exports.getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).lean();
  if (!client) {
    return res.status(404).json({ success: false, message: "Client not found" });
  }
  res.json({ success: true, client });
});


exports.getUsersByClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("GET /clients/:id/users -> id:", id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid client id:", id);
    return res.status(400).json({ success: false, message: "Invalid client id" });
  }

  const client = await Client.findById(id).lean();
  if (!client) {
    console.warn("Client not found for id:", id);
    return res.status(404).json({ success: false, message: "Client not found" });
  }

  // if client name is 'safetynett' (case-insensitive) return all users
  if (String(client.name || "").trim().toLowerCase() === "safetynett") {
    console.log("Client is safetynett — returning all users");
    const users = await User.find({}).select("-password").lean();
    return res.json({ success: true, users, allUsers: true });
  }

  // otherwise return only users with this clientId
  const users = await User.find({ clientId: id }).select("-password").lean();
  return res.json({ success: true, users, allUsers: false });
});
