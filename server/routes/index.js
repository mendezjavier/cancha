const express = require('express');
const app = express();

app.use(require('./user'));
app.use(require('./login'));
app.use(require('./place'));
app.use(require('./field'));
app.use(require('./reservation'));
// app.use(require('./upload'));
app.use(require('./images'));
app.use(require('./fcm'));

module.exports = app;