const News = require('../models/notification.js');
const logger = require('../../logger.js'); // Import your logger module


const getNotifications = async () => {
  try {
    const status = "active";
    const notifications = await News.find({ status });
    return notifications;
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return [];
  }
};

const notificationsMiddleware = async (req, res, next) => {
  try {
    const notifications = await getNotifications();
    res.locals.notifications = notifications;
    next();
  } catch (error) {
    logger.error("Error in notificationsMiddleware:", error);
    res.locals.notifications = []; // Set an empty array if an error occurs
    next();
  }
};

module.exports = { getNotifications, notificationsMiddleware };