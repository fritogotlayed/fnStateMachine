// All interactions with any storage mechanism should go through a "top level"
// repository such as this module. Implementation details should be hidden from
// callers to make supporting different stores as easy as possible.
const sqliteDb = require('./sqlite3');

const initializeSqliteDb = () => {
  const getDb = () => sqliteDb.getDb();

  const handleAppShutdown = () => getDb().then((db) => db.close());

  const getStateMachines = () => getDb().then((db) => sqliteDb.getStateMachines(db));
  const createStateMachine = (id, name, definition) => getDb()
    .then((db) => sqliteDb.createStateMachine(db, id, name, definition));
  const getStateMachine = (id) => getDb().then((db) => sqliteDb.getStateMachine(db, id));

  const createExecution = (id, versionId) => (
    getDb().then((db) => sqliteDb.createExecution(db, id, versionId)));
  const updateExecution = (id, status) => (
    getDb().then((db) => sqliteDb.updateExecution(db, id, status)));
  const getExecution = (id) => getDb().then((db) => sqliteDb.getExecution(db, id));
  const getStateMachineDefinitionForExecution = (id) => (
    getDb().then((db) => sqliteDb.getStateMachineDefinitionForExecution(db, id)));
  const getDetailsForExecution = (id) => (
    getDb().then((db) => sqliteDb.getDetailsForExecution(db, id)));

  const createOperation = (id, executionId, stateKey, input) => (
    getDb().then((db) => sqliteDb.createOperation(db, id, executionId, stateKey, input)));
  const updateOperation = (id, state, output) => (
    getDb().then((db) => sqliteDb.updateOperation(db, id, state, output)));
  const getOperation = (id) => getDb().then((db) => sqliteDb.getOperation(db, id));

  return {
    handleAppShutdown,
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
};

const initializeDatabase = () => {
  if (!process.env.FN_SM_DB_URL || process.env.FN_SM_DB_URL.startsWith('sqlite3://')) {
    return initializeSqliteDb();
  }

  throw new Error(`Database not configured properly. "${process.env.FN_SM_DB_URL}" not understood.`);
};

module.exports = initializeDatabase();
