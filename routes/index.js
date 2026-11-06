const router = require('express').Router();
const bcrypt = require('bcrypt');
const models = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const SALT_ROUNDS = 10;

router.get('/', (req, res) => res.render('main'));
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));
router.get('/comingSoon', (req, res) => res.render('comingSoon'));
router.post('/register', asyncHandler(async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const fullName = [req.body.firstname, req.body.lastname].filter(value => typeof value === 'string').join(' ').trim();
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).render('register', { message: 'Email and password are required.' });
  }
  if (await models.User.findOne({ where: { username: email } })) {
    return res.status(409).render('register', { message: 'User already exists.' });
  }
  await models.User.create({
    username: email, password: await bcrypt.hash(password, SALT_ROUNDS),
    fullName, userType: 'student',
  });
  res.redirect('/login');
}));
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).render('login', { message: 'Email and password are required.' });
  }
  const user = await models.User.findOne({ where: { username: email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).render('login', { message: 'Incorrect username or password.' });
  }
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  req.session.user = { userId: user.id };
  req.session.userType = user.userType;
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
  if (user.userType === 'admin') return res.redirect('/instructor/instructor-dash');
  if (user.userType === 'student') return res.redirect('/student/student-dashboard');
  res.redirect('/');
}));
module.exports = router;
