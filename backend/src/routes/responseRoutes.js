const express = require("express");
const router = express.Router();

const { getAllResponses } = require("../controllers/formController");

// ✅ ROOT path only
router.get("/", getAllResponses);

module.exports = router;
