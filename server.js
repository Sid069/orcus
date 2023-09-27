require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const logger = require('./logger.js');
const routes = require('./routes'); // Import the routes from routes.js
const auth = require("./src/middleware/responseAuth.js");
const cookieParser = require('cookie-parser');

require("./src/db/conn.js");

const port = process.env.PORT || 5000;

const staticPath = path.join(__dirname, "public");
const viewPath = path.join(__dirname, 'views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(staticPath));
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', viewPath);
app.use(cookieParser());

// Configure express-session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
  })
);

// ROUTES
app.use('/', routes);

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
