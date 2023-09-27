const axios = require('axios');
const logger = require('../../logger.js');
const Register = require('../models/registers'); // path to model

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.loginToken; // correct cookie name

    if (token) {
      if (req.user && req.user.tokens) { // Check if req.user and req.user.tokens are defined
        const googleAccessToken = req.user.tokens.find((t) => t.tokenType === 'access');

        if (!googleAccessToken) {
          logger.warn('Google access token not found');
          return res.status(401).send('Unauthorized');
        }
      } else {
        logger.warn('User not authenticated');
        return res.status(401).send('Unauthorized');
      }

      // Verify the Google access token with Google's API
      const googleUserInfo = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${googleAccessToken.token}`,
        },
      });

      if (!googleUserInfo.data || !googleUserInfo.data.id) {
        logger.warn('Google access token is invalid');
        return res.status(401).send('Unauthorized');
      }

      // Find the user based on the Google ID
      const user = await Register.findOne({ 'google.id': googleUserInfo.data.id });

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
        logger.warn("Google authenticated user not found in your database");
        return res.status(401).send('Unauthorized');
      }
    } else {
      logger.warn("No token found in the request");
    }

    // Continue to the next middleware or route
    next();
  } catch (error) {
    logger.error("Error during authentication:", error);
    res.status(500).send(error);
  }
};

module.exports = auth;