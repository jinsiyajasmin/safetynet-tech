const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, notificationController.listNotifications);
router.get("/unread-count", requireAuth, notificationController.unreadCount);
router.patch("/read-all", requireAuth, notificationController.markAllRead);
router.patch("/:id/read", requireAuth, notificationController.markRead);

module.exports = router;
