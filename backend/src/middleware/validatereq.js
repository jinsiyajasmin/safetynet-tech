
// src/middleware/validateReq.js
module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = {};
    error.details.forEach((d) => {
      const key = d.path && d.path.length ? d.path[d.path.length - 1] : 'body';
      errors[key] = d.message.replace(/\"/g, '');
    });
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};
