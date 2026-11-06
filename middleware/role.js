module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.userType)) return res.status(403).send('Access denied.');
  next();
};
