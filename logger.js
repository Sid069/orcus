const winston = require('winston');
const winstonDailyRotate = require('winston-daily-rotate-file');

// Define log levels and corresponding colors
const logLevels = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'green'
};

// Define the logging format
const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Configure daily log rotation
const transport = new winstonDailyRotate({
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m', // Max size of a single log file
  maxFiles: '7d'  // Retain logs for 7 days
});

// Create a winston logger instance
const logger = winston.createLogger({
  level: 'info', // Default log level
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'application.log', // Log all levels to this file
      level: 'info' // Log all levels
    })
  ]
});

module.exports = logger;