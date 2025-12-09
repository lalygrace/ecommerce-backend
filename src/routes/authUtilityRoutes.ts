import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { auth } from '../utils/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

// Set password for the currently authenticated user (useful for accounts created via OAuth or seed)
router.post('/set-password', requireAuth, async (req, res, next) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }
    await auth.api.setPassword({
      body: { password },
      headers: fromNodeHeaders(req.headers),
    });
    return res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

export default router;
