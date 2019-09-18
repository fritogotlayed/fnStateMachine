const { logger, delay } = require('../globals');
const repos = require('../repos');
const operations = require('../operations');
const Queue = require('./queue');

const internalQueueInterval = 50;
const batchProcessingSize = 1;
const internalQueue = new Queue();
let running = false;
const handleAppShutdown = () => { running = false; };

const handleOpCompleted = (operationId, executionId, runData) => {
  const { output, nextOpId, next } = runData;
  logger.verbose(`Operation ${operationId} completed. Output: ${JSON.stringify(output)}.`);
  repos.updateOperation(operationId, 'Succeeded', output)
    .then(() => next && internalQueue.enqueue({ executionId, operationId: nextOpId }))
    .catch((err) => logger.warn('set up next operation failed', err));
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
  if (internalQueue.size() > 0) {
    let count = 0;
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

const enqueueMessage = (message) => internalQueue.enqueue(message);

const startWorker = () => {
  if (!running) {
    running = true;
    delay(internalQueueInterval).then(() => processMessages());
  }
};

module.exports = {
  handleAppShutdown,
  enqueueMessage,
  startWorker,
};
