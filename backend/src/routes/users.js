const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");

// Public or Protected? Protected by requireAuth usually.
router.post("/check-user", requireAuth, usersController.checkUser);

// User routes
router.get("/", requireAuth, usersController.listAllUsers);
router.get("/:id", usersController.getUserById);
router.put("/:id/status", usersController.updateStatus);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);
module.exports = router;
