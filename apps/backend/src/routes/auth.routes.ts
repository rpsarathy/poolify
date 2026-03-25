import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, googleCallbackError, refresh, logoutHandler } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/google', authLimiter, passport.authenticate('google', { session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/error' }),
  googleCallback
);

router.get('/google/error', googleCallbackError);

router.post('/refresh', authLimiter, refresh);

router.post('/logout', authenticate, logoutHandler);

export default router;
