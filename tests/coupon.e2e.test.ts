import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { auth } from '../src/utils/auth.js';

describe('Coupons E2E', () => {
  let admin: any = null;

  beforeEach(async () => {
    admin = await prisma.user.create({
      data: { email: `adm+${Date.now()}@ex.com`, name: 'Admin', role: 'ADMIN' },
    });
    vi.spyOn((auth as any).api, 'getSession').mockImplementation(async () => ({
      user: { id: admin.id, role: 'ADMIN' },
    }));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (admin) await prisma.user.deleteMany({ where: { id: admin.id } });
    await prisma.coupon.deleteMany({ where: { code: { contains: 'TEST' } } });
  });

  it('allows admin to create coupon and validate it', async () => {
    const payload = {
      code: `TEST${Date.now()}`,
      type: 'FIXED',
      valueCents: 500,
      active: true,
    };
    const res = await request(app)
      .post('/api/v1/coupons')
      .send(payload)
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    const created = res.body?.data;
    expect(created).toBeTruthy();

    // validate coupon for an order
    vi.restoreAllMocks();
    const validateRes = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: created.code, totalCents: 2000 })
      .set('Accept', 'application/json');
    expect(validateRes.status).toBe(200);
    expect(validateRes.body?.data?.valid).toBe(true);
    expect(validateRes.body?.data?.discountCents).toBe(500);
  });
});
