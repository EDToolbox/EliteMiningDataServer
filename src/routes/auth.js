const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const User = require('../database/models/user');

const router = express.Router();

// Configure passport Frontier strategy using environment variables
passport.use(
  'frontier',
  new OAuth2Strategy(
    {
      authorizationURL: process.env.FRONTIER_AUTHORIZATION_URL || process.env.FRONTIER_AUTH_URL || 'https://frontier.example/oauth/authorize',
      tokenURL: process.env.FRONTIER_TOKEN_URL || process.env.FRONTIER_TOKEN_URL || 'https://frontier.example/oauth/token',
      clientID: process.env.FRONTIER_CLIENT_ID || 'FRONTIER_CLIENT_ID',
      clientSecret: process.env.FRONTIER_CLIENT_SECRET || 'FRONTIER_CLIENT_SECRET',
      callbackURL: process.env.FRONTIER_CALLBACK_URL || '/auth/frontier/callback',
    },
    async function (accessToken, refreshToken, params, profile, done) {
      try {
        // profile is not automatically fetched by passport-oauth2; try to fetch profile if configured
        let fetchedProfile = null;
        const profileUrl = process.env.FRONTIER_PROFILE_URL;
        if (profileUrl) {
          try {
            const res = await axios.get(profileUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
            fetchedProfile = res.data;
          } catch (err) {
            // ignore profile fetch error
            fetchedProfile = null;
          }
        }

        const providerId = (fetchedProfile && (fetchedProfile.id || fetchedProfile.userId)) || params.user_id || params.id || 'unknown';

        // Find or create a user
        let user = await User.findOne({ 'providers.providerName': 'frontier', 'providers.providerId': providerId });
        if (!user) {
          user = new User({ displayName: fetchedProfile?.displayName || fetchedProfile?.name || 'FrontierUser' });
        }

        await user.linkProvider({
          providerName: 'frontier',
          providerId,
          accessToken,
          refreshToken,
          profile: fetchedProfile || params,
        });

        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Passport session serialization
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Initiate Frontier OAuth
router.get('/frontier', passport.authenticate('frontier'));

// Callback
router.get(
  '/frontier/callback',
  passport.authenticate('frontier', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful auth, redirect to profile
    res.redirect('/profile.html');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout?.();
  req.session?.destroy?.(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
