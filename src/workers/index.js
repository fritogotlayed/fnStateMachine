const { logger } = require('../globals');
const internal = require('./internal');

const initializeQueue = () => {
  if (!process.env.FN_SM_MQ_URL) {
    logger.warn('Using internal message queue. This is not intended for production use.');
    logger.verbose('Staring in-process queue worker.');
    internal.startWorker();

    return {
      handleAppShutdown: internal.handleAppShutdown,
      enqueueMessage: internal.enqueueMessage,
    };
  }

  throw new Error(`Queue not configured properly. "${process.env.FN_SM_MQ_URL}" not understood.`);
};

module.exports = initializeQueue();
