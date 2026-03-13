const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getUsersByClient,
} = require("../controllers/clientsController");

const { requireAuth, requireRole } = require("../middleware/auth");
router.get("/", listClients);
router.get("/:id", getClient);
router.get("/:id/users", getUsersByClient);

router.post(
  "/",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  upload.single("logo"),
  createClient
);

router.put(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  upload.single("logo"),
  updateClient
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "company_admin"]),
  deleteClient
);

module.exports = router;
