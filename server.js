require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcryptjs");
const auth = require("./src/middleware/auth");
const session = require("express-session"); // Import express-session
const cookieParser = require("cookie-parser");
const axios = require("axios");
const cors = require("cors");
const logger = require('./logger.js'); // Import the logger

const { notificationsMiddleware, getNotifications } = require('./src/middleware/notificationMiddleware.js'); // Import the notificationsMiddleware
const autoLogin = require('./src/middleware/auto-login.js')

require("./src/db/conn.js");

const Register = require("./src/models/registers.js");
const Answer = require("./src/models/answer.js")

const port = process.env.PORT || 5000;

const staticPath = path.join(__dirname, "public");
const viewPath = path.join(__dirname, 'views');

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(staticPath));
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', viewPath);

// Use express-session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
  })
);

// Use the notificationsMiddleware
app.use(notificationsMiddleware);

// Middleware to set isIndexView to true and false
app.use((req, res, next) => {
  res.locals.isIndexView = (req.path === "/");
  next();
});

// Routes
app.get('/login', autoLogin, async (req, res) => {
  if (req.user) {
    // If user is already authenticated, perform auto-login
    logger.info('User is already authenticated. Performing auto-login.');
    res.redirect('/home');
  } else {
    // User is not authenticated, render the login page
    logger.info('User is not authenticated. Rendering login page.');
    res.render('loginpage.ejs', { errorMessage: null, user: req.session.user });
  }
});

app.get("/home", auth, (req, res) => {
  res.render('ques.ejs', { notifications: res.locals.notifications, user: req.session.user })
})

app.get('/register', (req, res) => {
  res.render("signup.ejs");
});

// Other routes that don't require notifications
app.get("/", (req, res) => {
  res.render("index.ejs", { user: req.session.user }); // Pass user data to index view
});

app.post("/register", async (req, res) => {
  let errorMessage; // Define the errorMessage variable

  try {
    const { name, email, phone, password, confpassword } = req.body;

    if (password !== confpassword) {
      logger.warn('Password and confirmation do not match.');
      return res.status(401).send("Passwords do not match");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const registerUser = new Register({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    const token = await registerUser.generateAuthToken();

    // Store user data securely in the session
    req.session.user = {
      _id: registerUser._id,
      name: registerUser.name,
      email: registerUser.email,
      phone: registerUser.phone,
    };

    // Store the token in a cookie
    res.cookie("loginToken", token);

    await registerUser.save();
    logger.info('User registered successfully.');
    res.status(201).redirect("/login");

  } catch (error) {
    logger.error(`Error during registration: ${error}`);
    errorMessage = "An error occurred during registration";
    res.status(400).render("loginpage", { errorMessage });
  }
});

app.post("/login", async (req, res) => {
  let errorMessage; // Declare the errorMessage variable here

  try {
    const { email, password } = req.body;

    if (!email) {
      // If email is not provided in the request, return an error message
      errorMessage = "Email is required.";
      return res.status(400).render("loginpage", { errorMessage });
    }

    const userEmail = await Register.findOne({ email });

    if (!userEmail) {
      logger.warn('Email not found during login. Email:', email);
      errorMessage = "Email not found. Please check your email or register.";
      return res.status(401).render("loginpage", { errorMessage });
    }

    const passwordMatch = await bcrypt.compare(password, userEmail.password);

    if (passwordMatch) {
      const token = await userEmail.generateAuthToken();

      // Store user data securely in the session
      req.session.user = {
        _id: userEmail._id,
        name: userEmail.name,
        email: userEmail.email,
        phone: userEmail.phone,
      };

      // Store the token in a cookie
      res.cookie("loginToken", token, {
        httpOnly: true,
      });

      const notifications = await getNotifications();
      res.status(200).render("ques", { notifications, user: req.session.user });
    } else {
      // User is not authenticated, render the login page
      logger.info('User is not authenticated. Rendering login page.');
      errorMessage = null; // Use let to modify errorMessage
      res.render('loginpage.ejs', { errorMessage });
    }
  } catch (error) {
    logger.error(`Error during login: ${error}`);
    errorMessage = "An error occurred during login";
    res.status(500).render("loginpage", { errorMessage });
  }
});

app.post("/submit-answer", auth, async (req, res) => {
  try {
    const { answer } = req.body;
    const user = req.session.user; // Assuming you have the user data in the session

    if (!answer) {
      // Handle the case when the answer is not provided
      return res.status(400).send("Answer is required.");
    }

    // Find the user's previous answer, if it exists
    const previousAnswer = await Answer.findOne({
      "user.email": user.email,
    });

    if (previousAnswer) {
      // If the user has a previous answer, append the new answer to the array
      previousAnswer.attempt += 1; // Increment the attempt count
      previousAnswer.answer.push(answer); // Append the new answer
      await previousAnswer.save();
    } else {
      // If there is no previous answer, create a new answer document
      const newAnswer = new Answer({
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        attempt: 1, // Set the attempt count to 1 for the first attempt
        answer: [answer], // Store the answer in an array
      });

      await newAnswer.save();
    }

    // Redirect the user to a page or do something else
    res.redirect("/response");
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    res.status(500).send("An error occurred while saving the answer.");
  }
});

// Other routes that require notifications
app.get("/response", auth, (req, res) => {
  res.render("response.ejs");
});

app.get("/right", (req, res) => {
  res.render("right.ejs", { user: req.session.user });
});

app.get("/wrong", (req, res) => {
  res.render("wrong.ejs", { user: req.session.user });
});

// Logout route handler
app.get('/logout', auth);

// ROUTE TO CATCH ALL OTHER ROUTES
app.get("*", (req, res) => {
  res.render("error404.ejs");
})

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});