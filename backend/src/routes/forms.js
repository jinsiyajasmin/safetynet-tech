const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const {
  saveForm,
  getAllForms,
  getFormById,
  deleteForm,
  saveResponse,
  getAllResponses,
  deleteResponse,
  updateResponse,
  sendResponseEmail
} = require("../controllers/formController");

// POST - Save form
router.post("/", requireAuth, saveForm);

// GET - Get all forms
router.get("/", requireAuth, getAllForms);

// GET - Get all responses (Must be defined BEFORE /:id)
router.get("/responses", requireAuth, getAllResponses);
router.delete("/responses/:id", deleteResponse);
router.put("/responses/:id", updateResponse);
router.post("/responses/:id/email", requireAuth, sendResponseEmail);

// GET - Get single form
router.get("/:id", getFormById);
router.delete("/:id", deleteForm);
router.post("/:id/responses", requireAuth, saveResponse);

module.exports = router;
