const got = require('got');
const uuid = require('uuid');

const { logger } = require('../globals');
const repos = require('../repos');
const enums = require('./enums');

function Task(definition, metadata) {
  if (definition.Type !== 'Task') throw new Error(`Attempted to use ${definition.Type} type for "Task".`);
  this.resource = definition.Resource;
  this.next = definition.Next;
  this.catch = definition.Catch;
  this.operationId = metadata.id;
  this.executionId = metadata.execution;
  this.input = metadata.input;
  this.output = undefined;
}

const handleInvokeResponse = (that, response) => {
  // TODO: Handle retries / error configurations.
  if (response.statusCode !== 200) { throw new Error(response.body); }

  const output = JSON.parse(response.body);
  const nextOpId = uuid.v4();
  const {
    next,
    operationId,
    executionId,
  } = that;

  return repos.updateOperation(operationId, enums.STATUS.Succeeded, output)
    .then(() => next && repos.createOperation(nextOpId, executionId, next, output))
    .then(() => ({
      nextOpId,
      output,
      next,
    }));
};

Task.prototype.run = function run() {
  let body = this.input;
  if (typeof body === 'object') {
    body = JSON.stringify(body);
  }

  logger.verbose(`Invoking remote function with input: ${body}`);
  const postOptions = {
    headers: {
      'content-type': 'application/json',
    },
    body,
  };

  return repos.updateOperation(this.operationId, enums.STATUS.Executing)
    .then(() => got.post(this.resource, postOptions))
    .then((resp) => handleInvokeResponse(this, resp));
};

module.exports = Task;
