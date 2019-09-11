const repos = require('../repos');
const enums = require('./enums');

function Task(definition, metadata) {
  if (definition.Type !== 'Succeed') throw new Error(`Attempted to use ${definition.Type} type for "Succeed".`);
  this.resource = definition.Resource;
  this.catch = definition.Catch;
  this.operationId = metadata.id;
  this.executionId = metadata.execution;
  this.input = metadata.input;
  this.output = metadata.input;
}

Task.prototype.run = function run() {
  this.output = this.input;
  if (typeof this.output === 'object') {
    this.output = JSON.stringify(this.output);
  }

  const {
    operationId,
    output,
    executionId,
  } = this;

  return repos.updateOperation(operationId, enums.STATUS.Succeeded, output)
    .then(() => repos.updateExecution(executionId, enums.STATUS.Succeeded))
    .then(() => ({ output }));
};

module.exports = Task;
