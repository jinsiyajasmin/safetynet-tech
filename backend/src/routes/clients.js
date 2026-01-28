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
  requireRole(["superadmin", "admin"]),
  upload.single("logo"),
  createClient
);

router.put(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "admin"]),
  upload.single("logo"),
  updateClient
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(["superadmin", "admin"]),
  deleteClient
);

module.exports = router;
