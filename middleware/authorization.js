const models = require('../models');
const asyncHandler = require('./asyncHandler');
module.exports = asyncHandler(async (req, res, next) => {
  const id = req.session && req.session.user && req.session.user.userId;
  if (!Number.isSafeInteger(id)) return res.redirect('/login');
  const user = await models.User.findByPk(id);
  if (!user) return res.redirect('/login');
  req.user = user;
  res.locals.isAuthenticated = true;
  next();
});
