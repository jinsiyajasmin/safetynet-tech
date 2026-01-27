const Joi = require('joi');

const signupSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'Username is required',
    'string.alphanum': 'Username must be letters or numbers',
  }),
  firstName: Joi.string().min(1).max(50).required().messages({ 'string.empty': 'First name is required' }),
  lastName: Joi.string().min(1).max(50).required().messages({ 'string.empty': 'Last name is required' }),
  email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email', 'string.empty': 'Email is required' }),
  jobTitle: Joi.string().allow('', null),
  employer: Joi.string().allow('', null),
  mobile: Joi.string().pattern(/^\+?\d{7,15}$/).required().messages({ 'string.empty': 'Mobile number is required', 'string.pattern.base': 'Enter a valid phone number (7–15 digits)' }),
  password: Joi.string().min(6).required().messages({ 'string.empty': 'Password is required', 'string.min': 'Use at least 6 characters' }),
  passwordConfirm: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match', 'any.required': 'Please confirm password' }),
});

module.exports = { signupSchema };
