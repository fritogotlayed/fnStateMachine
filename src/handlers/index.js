const uuid = require('uuid');

const repos = require('../repos');

const listStateMachines = (request, response) => repos.getStateMachines().then((result) => {
  response.send(JSON.stringify(result));
});

const createStateMachine = (request, response) => {
  const machineId = uuid.v4();
  return repos.createStateMachine(machineId, request.body.Name, request.body).then(() => {
    response.send(JSON.stringify({
      uuid: machineId,
    }));
  });
};

const getStateMachine = (request, response) => {
  const { id } = request.params;
  return repos.getStateMachine(id).then((machine) => {
    response.send(JSON.stringify({
      id: machine.id,
      name: machine.name,
      definition: machine.definition,
    }));
  });
};

/*
* Actions
  * create a new fnTask
  * update the flow of a fnTask
  * delete a fnTask
  * list available fnTasks
  * list executions for a fnTask
  * list list steps for a fnTask execution
*/

module.exports = {
  listStateMachines,
  createStateMachine,
  getStateMachine,
};
