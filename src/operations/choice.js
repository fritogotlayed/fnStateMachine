const uuid = require('uuid');

const repos = require('../repos');
const enums = require('./enums');

/* Comparison Operators
    And
    BooleanEquals
    Not
    NumericEquals
    NumericGreaterThan
    NumericGreaterThanEquals
    NumericLessThan
    NumericLessThanEquals
    Or
    StringEquals
    StringGreaterThan
    StringGreaterThanEquals
    StringLessThan
    StringLessThanEquals
    TimestampEquals
    TimestampGreaterThan
    TimestampGreaterThanEquals
    TimestampLessThan
    TimestampLessThanEquals
 */

function Choice(definition, metadata) {
  if (definition.Type !== 'Choice') throw new Error(`Attempted to use ${definition.Type} type for "Choice".`);
  this.resource = definition.Resource;
  this.catch = definition.Catch;
  this.choices = definition.Choices;
  this.defaultOption = definition.Default;
  this.operationId = metadata.id;
  this.executionId = metadata.execution;
  this.input = metadata.input;
  this.output = metadata.input;
}

function getValueFromPath(source, path) {
  let tempSource = source;
  const parts = path.split('.');

  parts.forEach((p) => {
    if (p === '$' || !tempSource) return;
    tempSource = tempSource[p];
  });

  return tempSource;
}

function processChoice(that) {
  const {
    choices,
    defaultOption,
  } = that;
  let next = null;

  choices.forEach((choice) => {
    if (next) return;

    if (Object.prototype.hasOwnProperty.call(choice, 'BooleanEquals')) {
      const value = choice.BooleanEquals;
      const variable = getValueFromPath(that.input, choice.Variable);

      if (value === variable) {
        next = choice.Next;
      }
    }
  });

  return next || defaultOption;
}

Choice.prototype.run = function run() {
  this.output = this.input;
  if (this.input) {
    try {
      this.input = JSON.parse(this.input);
    } catch (e) {
      // Ignore any errors from attempting to parse the input.
    }
  }
  if (typeof this.output === 'object') {
    this.output = JSON.stringify(this.output);
  }

  const nextOpId = uuid.v4();
  const {
    operationId,
    executionId,
    output,
  } = this;
  let next;

  return repos.updateOperation(operationId, enums.STATUS.Executing)
    .then(() => processChoice(this))
    .then((nextStateKey) => {
      next = nextStateKey;
      if (next) {
        repos.createOperation(nextOpId, executionId, next, output);
      }
    })
    .then(() => ({
      nextOpId,
      output,
      next,
    }));
};

module.exports = Choice;
