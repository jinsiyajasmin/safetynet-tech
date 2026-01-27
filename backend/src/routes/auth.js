const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupSchema } = require('../validators/authValidators');
const validateReq = require('../middleware/validatereq');
const { login } = require('../controllers/authController');

router.post('/signup', validateReq(signupSchema), authController.signup);
router.post('/login', authController.login);

module.exports = router;

