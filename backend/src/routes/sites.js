const express = require("express");
const router = express.Router();
const siteController = require("../controllers/siteController");
const { requireAuth } = require("../middleware/auth");

// All routes require authentication
router.use(requireAuth);

// Create a new site (Admin/Superadmin only? Or based on user request "Create Sites")
// Assuming broader access or specific roles for now.
router.post("/", siteController.createSite);

// Get all sites
router.get("/", siteController.getAllSites);

// Get site managers
router.get("/managers", siteController.getSiteManagers);

// Update/Delete site (Admin only potentially, or flexible for now)
router.put("/:id", siteController.updateSite);
router.delete("/:id", siteController.deleteSite);

module.exports = router;
