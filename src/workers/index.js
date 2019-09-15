const { logger } = require('../globals');
const internal = require('./internal');

const initializeQueue = (fromHttpApp) => {
  if (!process.env.FN_SM_MQ_URL) {
    if (!fromHttpApp) throw new Error('Stand-alone worker not designed to work with in-memory queue.');
    logger.warn('Using internal message queue. This is not intended for production use.');
    logger.verbose('Staring in-process queue worker.');
    internal.startWorker();

    return {
      handleAppShutdown: internal.handleAppShutdown,
      enqueueMessage: internal.enqueueMessage,
    };
  }

  const msg = `Queue not configured properly. "${process.env.FN_SM_MQ_URL}" not understood.`;
  throw new Error(msg);
};

module.exports = initializeQueue(require.main !== module);
