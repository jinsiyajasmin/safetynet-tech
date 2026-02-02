
const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userController");


router.get("/", usersController.listAllUsers);
router.get("/:id", usersController.getUserById);
router.put("/:id/status", usersController.updateStatus);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);
module.exports = router;
