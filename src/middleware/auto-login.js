const jwt = require("jsonwebtoken");
const Register = require('../models/registers');
const logger = require('../../logger.js'); // Import your logger module

// Middleware to check for auto-login
const autoLogin = async (req, res, next) => {
  try {
    const loginToken = req.cookies.loginToken; // Use the correct cookie name

    if (loginToken) {
      const decodedToken = jwt.verify(loginToken, process.env.SECRET_KEY);
      const user = await Register.findOne({
        _id: decodedToken._id,
        'tokens.token': loginToken
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    logger.error('Auto-login error:', error);
    next(); // Continue processing even if there's an error during auto-login
  }
};

module.exports = autoLogin;