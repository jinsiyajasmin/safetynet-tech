// src/controllers/clientsController.js
const asyncHandler = require('express-async-handler');
const prisma = require("../prismaClient");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // If generating UUIDs manually, otherwise Prisma does it

exports.listClients = asyncHandler(async (req, res) => {
  const { name } = req.query;
  const where = {};

  if (name) {
    // Case-insensitive search
    where.name = { contains: name, mode: 'insensitive' };
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const normalized = clients.map((c) => ({
    id: c.id,
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

    const logoUrl = req.file ? req.file.path : (req.body.logo || null);

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        logo: logoUrl || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Client created',
      client: { id: client.id, name: client.name, logo: client.logo || null },
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

exports.deleteClient = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE REQUEST RECEIVED for ID: ${id}`);
    console.log(`User requesting delete:`, req.user);

    // Check if client exists first
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      console.log("❌ Client not found in DB");
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    await prisma.client.delete({ where: { id } });
    console.log(`✅ Client deleted successfully: ${id}`);

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

    console.log(`UPDATE CLIENT - id: ${id}, body:`, req.body);
    if (req.file) console.log(`UPDATE CLIENT - file received:`, req.file.path);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const data = {};

    // update name if provided (trim)
    if (typeof name === 'string' && name.trim().length) {
      data.name = name.trim();
    }

    // if a new file uploaded, use the Cloudinary URL
    if (req.file) {
      const newLogo = req.file.path;
      // OPTIONAL: Delete old image from Cloudinary if needed.
      data.logo = newLogo;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: 'Client updated',
      client: { id: updatedClient.id, name: updatedClient.name, logo: updatedClient.logo || null },
    });
  } catch (err) {
    console.error('UPDATE CLIENT ERROR:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

exports.getClient = asyncHandler(async (req, res) => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) {
    return res.status(404).json({ success: false, message: "Client not found" });
  }
  res.json({ success: true, client });
});


exports.getUsersByClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("GET /clients/:id/users -> id:", id);

  // Prisma doesn't strictly need validation, checking existence is enough
  if (!id) {
    console.warn("Invalid client id:", id);
    return res.status(400).json({ success: false, message: "Invalid client id" });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    console.warn("Client not found for id:", id);
    return res.status(404).json({ success: false, message: "Client not found" });
  }

  // if client name is 'safetynett' (case-insensitive) return all users
  if (String(client.name || "").trim().toLowerCase() === "safetynett") {
    console.log("Client is safetynett — returning all users");
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, firstName: true, lastName: true, email: true,
        jobTitle: true, companyname: true, mobile: true, role: true, active: true,
        clientId: true, createdAt: true, updatedAt: true
        // Exclude password
      }
    });
    return res.json({ success: true, users, allUsers: true });
  }

  // otherwise return only users with this clientId
  const users = await prisma.user.findMany({
    where: { clientId: id },
    select: {
      id: true, username: true, firstName: true, lastName: true, email: true,
      jobTitle: true, companyname: true, mobile: true, role: true, active: true,
      clientId: true, createdAt: true, updatedAt: true
      // Exclude password
    }
  });
  return res.json({ success: true, users, allUsers: false });
});
