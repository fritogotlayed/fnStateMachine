const repos = require('../repos');
const enums = require('./enums');

function Fail(definition, metadata) {
  if (definition.Type !== 'Fail') throw new Error(`Attempted to use ${definition.Type} type for "Fail".`);
  this.resource = definition.Resource;
  this.catch = definition.Catch;
  this.operationId = metadata.id;
  this.executionId = metadata.execution;
  this.input = metadata.input;
  this.output = metadata.input;
}

Fail.prototype.run = function run() {
  this.output = this.input;
  if (this.output && typeof this.output === 'object') {
    this.output = JSON.stringify(this.output);
  }

  const {
    operationId,
    output,
    executionId,
  } = this;

  return repos.updateOperation(operationId, enums.STATUS.Succeeded, output)
    .then(() => repos.updateExecution(executionId, enums.STATUS.Failed))
    .then(() => ({ output }));
};

module.exports = Fail;
