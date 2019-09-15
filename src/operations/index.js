const Task = require('./task');
const Succeed = require('./succeed');
const Fail = require('./fail');
const Choice = require('./choice');

const getOperation = (definition, metadata) => {
  const { stateKey } = metadata;
  const currentState = definition.States[stateKey];
  switch (currentState.Type) {
    case 'Task':
      return new Task(currentState, metadata);
    case 'Succeed':
      return new Succeed(currentState, metadata);
    case 'Fail':
      return new Fail(currentState, metadata);
    case 'Choice':
      return new Choice(currentState, metadata);
    default:
      break;
  }

  throw new Error(`Attempted to use unknown operation type: ${stateKey}.`);
};

module.exports = {
  getOperation,
};
