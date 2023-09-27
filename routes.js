const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer")
const auth = require("./src/middleware/logInOutAuth");
const responseAuth = require("./src/middleware/responseAuth");
const {notificationsMiddleware} = require('./src/middleware/notificationMiddleware.js');
const Register = require("./src/models/registers.js");
const Riddles = require("./src/models/riddles.js")
const Answer = require("./src/models/answer.js");
const logger = require('./logger.js');
const autoLogin = require('./src/middleware/auto-login.js');
const passGoogle = require('./src/middleware/passAuthGoogle.js');
const passFacebook = require('./src/middleware/passAuthFacebook.js');



// Middlewares

// Middleware to set isIndexView to true and false
router.use((req, res, next) => {
  res.locals.isIndexView = (req.path === "/");
  next();
});

router.use(notificationsMiddleware);


// Routes
router.get('/login', autoLogin, async (req, res) => {
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

router.get('/auth/google', passGoogle.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.phonenumbers.read'],
}));

router.get('/auth/google/callback', passGoogle.authenticate('google', {
  successRedirect: '/home',
  failureRedirect: '/error',
}));

router.get('/auth/facebook', passFacebook.authenticate('facebook', { scope: ['email'] }));

router.get('/auth/facebook/callback', passFacebook.authenticate('facebook', {
  successRedirect: '/home',
  failureRedirect: '/error',
}));

router.get("/home", responseAuth, async (req, res) => {
  if (req.isAuthenticated) {
    // User is authenticated, render the response page
  res.render('home.ejs', { notifications: res.locals.notifications, user: req.session.user })
  } else {
    // User is not authenticated, handle accordingly (e.g., redirect or show an error)
    res.status(401).send('Unauthorized');
  }
});

router.get('/register', (req, res) => {
  res.render("signup.ejs");
});

router.get("/", (req, res) => {
  res.render("index.ejs", { user: req.session.user });
});

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
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

      res.status(200).redirect("/home");
    } else {
        // User is not authenticated, render the login page
        logger.info('User is not authenticated. Rendering login page.');
        errorMessage = "Incorrect Credentials. Please try again.";
        res.render("loginpage.ejs", { errorMessage });
      }
    } catch (error) {
      // Handle any errors that occur during the process
      console.error(error);
      res.status(500).render("loginpage", { errorMessage });
    }
});

router.post("/submit-answer", auth, async (req, res) => {
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
      // If the user has a previous answer, routerend the new answer to the array
      previousAnswer.attempt += 1; // Increment the attempt count
      previousAnswer.answer.push(answer); // routerend the new answer
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

router.get("/response", responseAuth, (req, res) => {
  // Check req.isAuthenticated to determine if the user is authenticated
  if (req.isAuthenticated) {
    // User is authenticated, render the response page
    res.render('response.ejs', { user: req.session.user });
  } else {
    // User is not authenticated, handle accordingly (e.g., redirect or show an error)
    res.status(401).send('Unauthorized');
  }
});

router.get("/right", (req, res) => {
  res.render("right.ejs", { user: req.session.user });
});

router.get("/wrong", (req, res) => {
  res.render("wrong.ejs", { user: req.session.user });
});

router.get('/logout', (req, res) => {
  // Destroy the Express session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    // Clear the loginToken cookie
    res.clearCookie('loginToken');
    logger.info('User logged out successfully');
    res.redirect('/login');
  });
});

router.get("/privacy", (req, res) => {
  res.render("privacy.ejs")
});

router.get("/terms", (req, res) => {
  res.render("terms.ejs")
});

router.get("/about", (req, res) => {
  res.render("about.ejs")
});

router.get("/contact-us", (req, res) => {
  res.render("contact.ejs")
});

// Set up Nodemailer transporter with your email service credentials
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_PROVIDER, // E.g., "Gmail", "Outlook", etc.
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PROVIDER,
  },
});

// Handle POST request to /contact
router.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  // Email content
  const mailOptions = {
    from: "your_email@example.com",
    to: "weorcus@gmail.com", // Replace with your recipient's email address
    subject: "New Contact Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error sending email.");
    } else {
      console.log("Email sent: " + info.response);
      res.send("Thank you for your message! We will get back to you soon.");
    }
  });
});

router.get("/copyright", (req, res) => {
  res.render("copyright.ejs")
});

router.get('/forgot-password', (req, res) => {
  let errorMessage = null;
  let email = null;
  res.render('forgotPass', { errorMessage, email, emailFound: false }); // Initialize emailFound to false
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  let errorMessage = ''; // Initialize errorMessage as an empty string

  const user = await Register.findOne({ email });
  const emailFound = !!user; // Convert to boolean

  if (!emailFound) {
    // User not found, set error flag and message
    errorMessage = 'User not found. Please check your email address.';
  } else {
    // User found, store the email in the session
    req.session.email = email;
  }

  res.render('forgotPass', { errorMessage, emailFound, email });
});

router.post('/reset-password', async (req, res) => {
  const { password, confirmPassword } = req.body;
  const userEmail = req.session.email; // Retrieve the email from the session

  try {
    // Check if the password and confirm password match
    if (password !== confirmPassword) {
      const errorMessage = 'Password and confirm password do not match.';
      return res.render('forgotPass', { errorMessage, emailFound: true, email: userEmail });
    }

    // Encrypt the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password using the email
    await Register.findOneAndUpdate({ email: userEmail }, { password: hashedPassword });

    // Password updated successfully
    delete req.session.email; // Remove the email from the session
    return res.redirect('/login');
  } catch (error) {
    console.error('Error updating password:', error);
    const errorMessage = 'An error occurred while updating the password.';
    return res.render('forgotPass', { errorMessage, emailFound: true, email: userEmail });
  }
});


router.get("/riddle-game", async (req, res) => {
  try {
    // Fetch a random riddle from the database
    const randomRiddle = await Riddles.aggregate([{ $sample: { size: 1 } }]);

    if (randomRiddle.length === 0) {
      return res.status(404).send("No riddles found.");
    }

    currentRiddle = randomRiddle[0];

    res.render("riddle-game.ejs", { riddle: currentRiddle, message: "" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred.");
  }
});

// Define a route to handle the submission of the riddle answer
router.post("/riddle-game", (req, res) => {
  const { answer } = req.body;

  if (!currentRiddle) {
    return res.status(404).send("Riddle not found.");
  }

  if (answer.toLowerCase() === currentRiddle.answer.toLowerCase()) {
    // Correct answer
    const message = "Correct answer!";
    currentRiddle = null; // Reset the current riddle
    res.render("riddle-game.ejs", { riddle: "", message });
  } else {
    // Wrong answer
    const message = "Wrong answer. Try again.";
    res.render("riddle-game.ejs", { riddle: currentRiddle, message });
  }
});



router.get("/add-riddle", async (req, res) => {
  res.render("add-riddle.ejs");
});

router.post("/add-riddle", async (req, res) => {
  try {
    // Retrieve the riddle text and answer from the request body
    const { riddleText, riddleAnswer } = req.body;

    // Create a new riddle document and save it to the database
    const newRiddle = new Riddles({ text:riddleText, answer:riddleAnswer });
    await newRiddle.save();

    res.status(201).json({ message: "Riddle added successfully!" });
  } catch (error) {
    console.error("Error adding a new riddle:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


router.get("/test", (req, res) => {
  res.render("indexTest.ejs", { notification: res.locals.notifications, user: req.session.user })
});

router.get("*", (req, res) => {
  res.render("error404.ejs");
});

module.exports = router;
