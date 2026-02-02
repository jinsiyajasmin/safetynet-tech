const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.listAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();

    const formatted = users.map((u) => ({
      _id: u._id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      companyname: u.companyname || "",
      role: u.role || "user",
      active: typeof u.active === "boolean" ? u.active : true,
      createdAt: u.createdAt,
    }));

    res.json({ success: true, users: formatted });
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (password) {
    // The pre-save hook in User model will handle hashing
    user.password = password;
  }
  if (role) {
    // optional: validate role enum
    if (["superadmin", "admin", "user"].includes(role)) {
      user.role = role;
    }
  }

  await user.save();

  res.json({ success: true, message: "User updated successfully" });
});
exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({ success: false, message: "Invalid 'active' value (expected boolean)" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.active = active;
  await user.save();

  const u = user.toObject();
  delete u.password;

  res.json({ success: true, message: "User status updated", user: u });
});
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  const user = await User.findById(id).select("-password").lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const out = {
    _id: user._id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    jobTitle: user.jobTitle ?? user.jobTitle ?? null,
    mobile: user.mobile ?? null,
    companyname: user.companyname ?? user.company ?? "",
    role: user.role ?? "user",
    active: typeof user.active === "boolean" ? user.active : true,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  };

  res.json({ success: true, user: out });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await user.deleteOne();
  res.json({ success: true, message: "User deleted successfully", id });
});
