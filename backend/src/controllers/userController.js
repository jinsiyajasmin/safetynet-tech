const asyncHandler = require("express-async-handler");
const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");

exports.listAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formatted = users.map((u) => ({
      _id: u.id, // alias for frontend compatibility
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      companyname: u.companyname || "",
      role: u.role || "worker",
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
  const { firstName, lastName, email, password, role, jobTitle, companyname, mobile } = req.body;

  const data = {};
  if (firstName) data.firstName = firstName.trim();
  if (lastName) data.lastName = lastName.trim();
  if (email) data.email = email.trim().toLowerCase();

  if (jobTitle) data.jobTitle = jobTitle.trim();
  if (companyname) data.companyname = companyname.trim(); // "Site"
  if (mobile) data.mobile = mobile.trim();

  if (password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(password, salt);
  }
  if (role) {
    // optional: validate role enum
    if (["superadmin", "company_admin", "site_manager", "supervisor", "worker"].includes(role)) {
      data.role = role;
    }
  }

  await prisma.user.update({
    where: { id },
    data
  });

  res.json({ success: true, message: "User updated successfully" });
});
exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({ success: false, message: "Invalid 'active' value (expected boolean)" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { active }
  });

  const u = { ...user };
  delete u.password;

  res.json({ success: true, message: "User status updated", user: u });
});
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const out = {
    _id: user.id,
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    jobTitle: user.jobTitle ?? user.jobTitle ?? null,
    mobile: user.mobile ?? null,
    companyname: user.companyname ?? user.company ?? "",
    role: user.role ?? "worker",
    active: typeof user.active === "boolean" ? user.active : true,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  };

  res.json({ success: true, user: out });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if exists
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: "User deleted successfully", id });
});

exports.checkUser = asyncHandler(async (req, res) => {
  const { email, companyId } = req.body;
  if (!email || !companyId) {
    return res.status(400).json({ success: false, message: "Email and Company ID required" });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      clientId: companyId
    }
  });

  if (user) {
    res.json({ success: true, exists: true, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    // Check if user exists but in different company (optional hint)
    const other = await prisma.user.findUnique({ where: { email } });
    if (other) {
      res.json({ success: true, exists: false, message: "User exists but belongs to a different company." });
    } else {
      res.json({ success: true, exists: false, message: "User doesn't exist." });
    }
  }
});
