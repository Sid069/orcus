const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/registers.js'); // Adjust the path as needed
// const { ensureAuthenticated } = require('./middleware'); // Create this middleware to check if a user is authenticated

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // Check if the user is already registered in your database
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // User already exists, update tokens if needed
          existingUser.facebookToken = accessToken;
          await existingUser.save();
          return done(null, existingUser);
        } else {
          // User does not exist, create a new user
          const newUser = new User({
            name: profile.displayName,
            email,
            tokens: [{ token: accessToken, tokenType: 'access' }],
          });

          // Save the new user to your database
          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error('Error during Facebook OAuth authentication:', error);
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
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;
