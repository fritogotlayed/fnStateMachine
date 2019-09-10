const { logger } = require('../globals');

const configureRoutes = (app) => {
  app.get('/', (req, res) => {
    logger.verbose('Handling /.');
    res.send('Hello World!');
  });

  app.post('/', (req, res, ...args) => {
    logger.verbose('Handling /.');
    res.send('Hello World!');
  });
};

module.exports = {
  configureRoutes,
};
