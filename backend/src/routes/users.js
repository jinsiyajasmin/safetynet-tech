const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");

// Check if user exists — superadmin only (Enable user access page)
router.post(
  "/check-user",
  requireAuth,
  requireRole(["superadmin"]),
  usersController.checkUser
);

// Get stats — superadmin only
router.get(
  "/stats",
  requireAuth,
  requireRole(["superadmin"]),
  usersController.getAdminStats
);

// Invite a new user — company_admin and above
router.post(
  "/invite",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  usersController.inviteUser
);

// List all users — superadmin and company_admin only (Users page)
router.get(
  "/",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  usersController.listAllUsers
);

// Get single user — authenticated users (used in profile views)
router.get("/:id", requireAuth, usersController.getUserById);

// Toggle active/inactive — company_admin and above
router.put(
  "/:id/status",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  usersController.updateStatus
);

// Edit user details / role — company_admin and above
router.put(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  usersController.updateUser
);

// Delete user — company_admin (own org) and superadmin
router.delete(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  usersController.deleteUser
);

module.exports = router;
