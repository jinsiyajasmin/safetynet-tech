const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

router.get("/stats", requireAuth, dashboardController.getDashboardStats);
router.get("/section-stats/:section", requireAuth, dashboardController.getSectionDashboardStats);

module.exports = router;
