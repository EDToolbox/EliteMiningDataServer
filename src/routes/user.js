const express = require('express');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Return current user profile
router.get('/me', ensureAuthenticated, (req, res) => {
  const user = req.user;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user._id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    providers: user.providers,
    miningReports: user.miningReports || [],
  });
});

// Return user's mining reports (placeholder)
router.get('/reports', ensureAuthenticated, async (req, res) => {
  // For now, return empty or ids stored on user
  const user = await req.app.locals.database?.getUserReports?.(req.user._id).catch(() => null);
  if (user) return res.json(user);
  return res.json({ reports: req.user.miningReports || [] });
});

module.exports = router;
