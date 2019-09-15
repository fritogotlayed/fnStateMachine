const sqlite = require('sqlite');
const uuid = require('uuid');

const { logger } = require('../../globals');

const createOperationTableSql = `
CREATE TABLE IF NOT EXISTS Operation (
    id        TEXT PRIMARY KEY,
    execution TEXT NOT NULL,
    created   TEXT NOT NULL,
    stateKey  TEXT NOT NULL,
    status    TEXT NOT NULL,
    input     TEXT,
    output    TEXT,
  FOREIGN KEY (execution) REFERENCES Execution (id) ON DELETE CASCADE
) WITHOUT ROWID;
`;

const createExecutionTableSql = `
CREATE TABLE IF NOT EXISTS Execution (
    id      TEXT PRIMARY KEY,
    created TEXT NOT NULL,
    status  TEXT NOT NULL,
    version TEXT NOT NULL,
  FOREIGN KEY (version) REFERENCES StateMachineVersion (id) ON DELETE CASCADE
) WITHOUT ROWID;
`;

const createStateMachineVersionTableSql = `
CREATE TABLE IF NOT EXISTS StateMachineVersion (
    id         TEXT PRIMARY KEY,
    definition TEXT NOT NULL
) WITHOUT ROWID;
`;

const createStateMachineTableSql = `
CREATE TABLE IF NOT EXISTS StateMachine (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    active_version TEXT NOT NULL,
  FOREIGN KEY (active_version) REFERENCES StateMachineVersion (id) ON DELETE CASCADE
) WITHOUT ROWID;
`;

let internalDb;
const getDb = () => {
  if (!internalDb) {
    logger.debug('Initializing in-memory database');

    const database = sqlite.open(':memory:', { Promise });

    return database.then((dbObj) => {
      internalDb = dbObj;
      return dbObj.run(createStateMachineVersionTableSql)
        .then(() => dbObj.run(createStateMachineTableSql))
        .then(() => dbObj.run(createExecutionTableSql))
        .then(() => dbObj.run(createOperationTableSql))
        .then(() => logger.debug('in-memory database initialized.'))
        .then(() => dbObj)
        .catch((err) => {
          logger.error('Failed to create database', err);
          throw err;
        });
    });
  }

  const db = internalDb;
  return Promise.resolve(db);
};

const getStateMachines = (db) => db.all('SELECT * FROM StateMachine').then((results) => results);

const createStateMachine = (db, id, name, definitionObject) => {
  const versionId = uuid.v4();
  return db.run('INSERT INTO StateMachineVersion VALUES (?, ?)', [versionId, JSON.stringify(definitionObject)])
    .then(() => db.run('INSERT INTO StateMachine VALUES (?, ?, ?)', [id, name, versionId]));
};

const getStateMachine = (db, id) => db.get('SELECT * FROM StateMachine WHERE id = ?', [id])
  .then((stateMachine) => db.get('SELECT * FROM StateMachineVersion WHERE id = ?', [stateMachine.active_version]).then((stateMachineVersion) => ({ stateMachine, stateMachineVersion }))).then((data) => ({
    ...data.stateMachine,
    definition: JSON.parse(data.stateMachineVersion.definition),
  }))
  .catch((err) => {
    logger.warn('Error during execution', err);
  });

const createExecution = (db, id, versionId) => db.run('INSERT INTO Execution VALUES (?, ?, ?, ?)', [id, new Date().toISOString(), 'Pending', versionId]);
const updateExecution = (db, id, status) => db.run('UPDATE Execution SET status = ? WHERE id = ?', [status, id]);
const getExecution = (db, id) => db.get('SELECT * FROM Execution WHERE id = ?', [id]);
const getStateMachineDefinitionForExecution = (db, id) => db.get('SELECT smv.definition FROM Execution AS e JOIN StateMachineVersion AS smv ON e.version = smv.id WHERE e.id = ?', [id]);
const getDetailsForExecution = (db, id) => db.all('SELECT e.status AS executionStatus, o.* FROM Execution AS e JOIN Operation AS o ON e.id = o.execution WHERE e.id = ?', [id]);

const createOperation = (db, id, executionId, stateKey, input) => db.run('INSERT INTO Operation VALUES (?, ?, ?, ?, ?, ?, NULL)', [id, executionId, new Date().toISOString(), stateKey, 'Pending', input]);
const updateOperation = (db, id, state, output) => db.run('UPDATE Operation SET status = ?, output = ? WHERE id = ?', [state, output, id]);
const getOperation = (db, id) => db.get('SELECT * FROM Operation WHERE id = ?', [id]);

module.exports = {
  getDb,
  getStateMachines,
  createStateMachine,
  getStateMachine,
  createExecution,
  updateExecution,
  getExecution,
  getStateMachineDefinitionForExecution,
  getDetailsForExecution,
  createOperation,
  updateOperation,
  getOperation,
};
