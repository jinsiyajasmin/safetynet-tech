// src/validators/clientsValidators.js
const Joi = require('joi');

const createClientSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'Client name is required',
  }),
  logo: Joi.string().uri({ scheme: ['http','https'] }).allow(null, '').messages({
    'string.uri': 'Logo must be a valid URL (http:// or https://)',
  }),
});

module.exports = { createClientSchema };
