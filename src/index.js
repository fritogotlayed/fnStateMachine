const bodyParser = require('body-parser');
const express = require('express');
const { logger } = require('./globals');
const handlers = require('./handlers');
const appShutdown = require('./handlers/app_shutdown');

const app = express();
const port = 8080;

appShutdown.wire();
app.use(bodyParser.json());
handlers.configureRoutes(app);

app.listen(port, () => logger.info(`Example app listening on port ${port}!`));
