const jwt = require("jsonwebtoken");
const Register = require('../models/registers'); // Update the path to your model
const logger = require('../../logger.js'); // Import your logger module

const auth = async (req, res, next) => {
  try {
    // Check if a valid JWT token is present
    const token = req.cookies.loginToken; // Use the correct cookie name

    if (token) {
      // Verify and decode the token
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

      // Find the user based on the decoded token
      const user = await Register.findOne({
        _id: decodedToken._id,
        'tokens.token': token
      });

      if (user) {
        // If it's a logout request (e.g., based on route or request method), clear the token and save the user
        if (req.path === '/logout' && req.method === 'GET') {
          user.tokens = [];
          await user.save();
          res.clearCookie("loginToken");
          logger.info("User logged out successfully");
          return res.redirect("/login");
        }

        // If it's a login request, store the user object in req.user for later use
        req.user = user;
      } else {
        logger.warn("Invalid authentication token");
      }
    }

    // Continue to the next middleware or route
    next();
  } catch (error) {
    logger.error("Error during authentication:", error);
    res.status(500).send(error);
  }
};

module.exports = auth;