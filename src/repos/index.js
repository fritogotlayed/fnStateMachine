// All interactions with any storage mechanism should go through a "top level"
// repository such as this module. Implementation details should be hidden from
// callers to make supporting different stores as easy as possible.
const sqliteDb = require('./sqlite3/db');

/**
 * Cleans up any resources being held by the application related to storage.
 */
const handleAppShutdown = () => sqliteDb.getDb().then((db) => db.close());
const getStateMachines = () => sqliteDb.getDb().then((db) => sqliteDb.getStateMachines(db));
const createStateMachine = (id, name, definition) => sqliteDb.getDb()
  .then((db) => sqliteDb.createStateMachine(db, id, name, definition));
const getStateMachine = (id) => sqliteDb.getDb().then((db) => sqliteDb.getStateMachine(db, id));

module.exports = {
  handleAppShutdown,
  getStateMachines,
  createStateMachine,
  getStateMachine,
};
