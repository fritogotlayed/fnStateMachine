const logger = require('./logger');

/**
 * returns the current logger for the application
 */
const activeLogger = logger.buildLogger();

/**
 * Promise wrapper around process.nextTick
 */
const nextTick = () => new Promise((resolve) => process.nextTick(resolve()));

module.exports = {
  logger: activeLogger,
  nextTick,
};
