// src/controllers/authController.js
const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');

// signup
exports.signup = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  // do not store passwordConfirm
  delete payload.passwordConfirm;

  try {
    const { user, token } = await authService.signup(payload);
    // return user and token (structure your response as frontend expects)
    res.status(201).json({ success: true, message: 'Account created', user, token });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ success: false, message: err.message });
    throw err; // allow your global error handler to handle other errors
  }
});


// controllers/authController.js (replace your current exports.login with this)
exports.login = asyncHandler(async (req, res) => {
  try {
    console.log('LOGIN REQ BODY:', req.body);
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // normalize email
    const normalizedEmail = String(email).toLowerCase().trim();

    const result = await authService.login({ email: normalizedEmail, password });

    if (!result || !result.user || !result.token) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // result.user may be a mongoose doc or plain object
    const userObj = result.user.toObject ? result.user.toObject() : { ...result.user };

    // ensure boolean active field — treat missing as active (change if you want default false)
    const isActive = typeof userObj.active === 'boolean' ? userObj.active : true;

    if (!isActive) {
      // user is blocked / inactive — do not issue token
      return res.status(403).json({ success: false, message: 'User is blocked. Please contact your administrator.' });
    }

   
    delete userObj.password;

    // return token + user
    return res.json({ success: true, user: userObj, token: result.token });
  } catch (err) {
    console.error('AUTH LOGIN ERROR:', err.stack || err);
    const body = { success: false, message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
    res.status(err.status || 500).json(body);
  }
});
