import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
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
