const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Register = require('../models/registers.js'); // Adjust the path as needed
const logger = require('../../logger.js');

// Configure the Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.phonenumbers.read'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user is already registered in your database
        const existingUser = await Register.findOne({ email: profile.emails[0].value });

        if (existingUser) {
          // User already exists, update tokens if needed
          existingUser.tokens.push({ token: accessToken, tokenType: 'access' });
          if (refreshToken) {
            existingUser.tokens.push({ token: refreshToken, tokenType: 'refresh' });
          }
          await existingUser.save();
          return done(null, existingUser);
        } else {
          // User does not exist, create a new user
          const newUser = new Register({
            name: profile.displayName,
            email: profile.emails[0].value,
            phone: profile.phoneNumbers ? profile.phoneNumbers[0].value : null,
            tokens: [{ token: accessToken, tokenType: 'access' }],
          });

          if (refreshToken) {
            newUser.tokens.push({ token: refreshToken, tokenType: 'refresh' });
          }

          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        logger.error('Error during Google OAuth authentication:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Register.findById(id);
    done(null, user);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;
