const logger = require('./logger');

const activeLogger = logger.buildLogger();

module.exports = {
  logger: activeLogger,
};
