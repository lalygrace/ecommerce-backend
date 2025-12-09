import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { auth } from '../utils/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/users/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const actorId = (req as any).session?.user?.id;
    const ip = req.ip;
    const targetUserId = req.params.id;
    const { newRole, reason } = req.body as {
      newRole: string;
      reason?: string;
    };

    if (!newRole || !['admin', 'seller', 'customer'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const roleMap: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      seller: UserRole.SELLER,
      customer: UserRole.CUSTOMER,
    };

    if (!targetUserId)
      return res.status(400).json({ error: 'Missing target user id' });

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const mappedRole = roleMap[newRole];
    if (!mappedRole)
      return res.status(400).json({ error: 'Invalid role mapping' });

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: mappedRole },
    });

    // RoleAudit client may require prisma client regeneration; use any to avoid type errors until generated
    await (prisma as any).roleAudit.create({
      data: {
        actorId,
        targetUserId,
        previousRole: String(target.role),
        newRole,
        reason,
        ip,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

export default router;

// Set password for the currently authenticated admin (server-side only per Better Auth docs)
router.post('/self/set-password', requireAdmin, async (req, res, next) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: req.headers as any,
    });
    return res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});
