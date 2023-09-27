// responseAuth middleware
const responseAuth = (req, res, next) => {
// Check if the user is authenticated (user object is attached to req)
if (req.session.user) {
    // User is authenticated
    req.isAuthenticated = true;
} else {
    // User is not authenticated
    req.isAuthenticated = false;
}

// Continue to the next middleware or route
next();
};

module.exports = responseAuth;