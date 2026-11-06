const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const path = require('path');
const session = require('express-session');
const checkAuthorization = require('./middleware/authorization');
const requireRole = require('./middleware/role');
const secret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === 'production' && !secret) throw new Error('SESSION_SECRET must be configured');
app.use(session({
  secret: secret || require('crypto').randomBytes(32).toString('hex'),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));
const VIEWS_PATH = path.join(__dirname, 'views');
global.__basedir = __dirname;
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.locals.isAuthenticated = Boolean(req.session && req.session.user);
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/', require('./routes/index'));
app.use('/student', checkAuthorization, requireRole('student'), require('./routes/student'));
app.use('/instructor', checkAuthorization, requireRole('admin'), require('./routes/instructor'));
app.engine('mustache', mustacheExpress(path.join(VIEWS_PATH, 'partials'), '.mustache'));
app.set('views', VIEWS_PATH);
app.set('view engine', 'mustache');
app.get('/signout', (req, res, next) => {
  req.session.destroy(error => error ? next(error) : res.redirect('/'));
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).send('Unable to complete the request.');
});
if (require.main === module) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => console.log('Server running on port ' + port));
}
module.exports = app;
