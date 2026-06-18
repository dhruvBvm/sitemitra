const ownerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Owner or Manager only.' });
  }
  next();
};
module.exports = ownerOnly;
