const Task = require('./task');
const Succeed = require('./succeed');

const getOperation = (definition, metadata) => {
  const { stateKey } = metadata;
  const currentState = definition.States[stateKey];
  switch (currentState.Type) {
    case 'Task':
      return new Task(currentState, metadata);
    case 'Succeed':
      return new Succeed(currentState, metadata);
    default:
      break;
  }

  throw new Error(`Attempted to use unknown operation type: ${key}.`);
};

module.exports = {
  getOperation,
};
