const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupSchema } = require('../validators/authValidators');
const validateReq = require('../middleware/validatereq');
const { login } = require('../controllers/authController');

const { requireAuth } = require('../middleware/auth');

router.post('/signup', validateReq(signupSchema), authController.signup);
router.post('/login', authController.login);

// 2FA Routes
router.post('/setup-2fa', requireAuth, authController.setup2FA);
router.post('/verify-2fa', requireAuth, authController.verify2FA);

router.post('/reset-password', authController.resetPassword);

module.exports = router;

