const sqlite = require('sqlite');
const uuid = require('uuid');

const { logger } = require('../../globals');

const createTaskTableSql = `
CREATE TABLE IF NOT EXISTS Task (
    id        TEXT PRIMARY KEY,
    execution TEXT NOT NULL,
    created   TEXT NOT NULL,
    input     TEXT NOT NULL,
    output    TEXT NOT NULL,
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
        .then(() => dbObj.run(createTaskTableSql))
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
  }));


module.exports = {
  getDb,
  getStateMachines,
  createStateMachine,
  getStateMachine,
};
