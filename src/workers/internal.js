const { logger, delay } = require('../globals');
const repos = require('../repos');
const operations = require('../operations');
const Queue = require('./queue');
const enums = require('../enums');

const internalQueueInterval = 50;
const batchProcessingSize = 1;

// This is the general queue that new invocations from the HTTP endpoints are sent to.
// They are lesser priority than in-flight work.
const internalQueue = new Queue();

// This is the queue for executions that are currently in flight. We try to get executions
// that are mid flight out the way before starting "pending" work.
const inFlightQueue = new Queue();

let running = false;
const handleAppShutdown = () => { running = false; };

const handleOpCompleted = (operationId, executionId, runData) => {
  if (runData) {
    const { output, nextOpId, next } = runData;
    logger.verbose(`Operation ${operationId} completed. Output: ${JSON.stringify(output)}.`);
    repos.updateOperation(operationId, 'Succeeded', output)
      .then(() => next && inFlightQueue.enqueue({ executionId, operationId: nextOpId }))
      .catch((err) => logger.warn('set up next operation failed', err));
  }
};

const buildOperationDataBundle = (metadata) => (
  repos.getStateMachineDefinitionForExecution(metadata.execution)
    .then((definition) => ({ metadata, definition })));

const invokeOperation = (data) => {
  const { definition, metadata } = data;
  const t = operations.getOperation(definition, metadata);
  const operationId = metadata.id;
  const executionId = metadata.execution;

  repos.updateOperation(operationId, 'Executing')
    .then(() => t.run())
    .then((runData) => handleOpCompleted(operationId, executionId, runData))
    .catch((err) => logger.warn('operation run failed', err));
};

const processMessage = (message) => {
  if (message.fromInvoke) {
    repos.updateExecution(message.executionId, 'Executing');
  }

  repos.getOperation(message.operationId)
    .then((operation) => buildOperationDataBundle(operation))
    .then((data) => invokeOperation(data))
    .catch((err) => logger.warn('process message failed', err));
};

const processMessages = () => {
  let count = 0;
  if (inFlightQueue.size() > 0) {
    while (count < batchProcessingSize && inFlightQueue.size() > 0) {
      const message = inFlightQueue.dequeue();
      processMessage(message);
      count += 1;
    }
  }

  if (internalQueue.size() > 0) {
    while (count < batchProcessingSize && internalQueue.size() > 0) {
      const message = internalQueue.dequeue();
      processMessage(message);
      count += 1;
    }
  }

  if (running) {
    delay(internalQueueInterval).then(() => processMessages());
  }
};

const enqueueDelayedMessages = () => {
  repos.getDelayedOperations(new Date().toISOString()).then((allDelayed) => {
    allDelayed.forEach((delayed) => repos.updateOperation(delayed.id, enums.OP_STATUS.Pending)
      .then(() => inFlightQueue.enqueue({
        executionId: delayed.execution,
        operationId: delayed.id,
      })));
  });
  // .then(() => next && internalQueue.enqueue({ executionId, operationId: nextOpId }))

  if (running) {
    delay(internalQueueInterval).then(() => enqueueDelayedMessages());
  }
};

const enqueueMessage = (message) => internalQueue.enqueue(message);

const startWorker = () => {
  if (!running) {
    running = true;
    delay(internalQueueInterval).then(() => processMessages());
    delay(internalQueueInterval).then(() => enqueueDelayedMessages());
  }
};

module.exports = {
  handleAppShutdown,
  enqueueMessage,
  startWorker,
};
