import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { auth } from '../src/utils/auth.js';

describe('Products E2E', () => {
  let user: any = null;
  let seller: any = null;
  let vendor: any = null;

  beforeEach(async () => {
    // create a test user
    user = await prisma.user.create({
      data: {
        email: `test+${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    // create seller profile linked to user
    seller = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: 'Seller Test',
        slug: `seller-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });

    // create vendor for the seller
    vendor = await prisma.vendor.create({
      data: {
        sellerId: seller.id,
        name: 'Test Vendor',
        slug: `vendor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });

    // mock Better Auth session to return our user id
    vi.spyOn((auth as any).api, 'getSession').mockImplementation(async () => ({
      user: { id: user.id },
    }));
  });

  afterEach(async () => {
    // remove created records in reverse order
    if (user) {
      // delete products by vendor (only if vendor was created)
      if (vendor && vendor.id) {
        await prisma.product.deleteMany({ where: { vendorId: vendor.id } });
        await prisma.vendor.deleteMany({ where: { id: vendor.id } });
      }
      if (seller && seller.id) {
        await prisma.sellerProfile.deleteMany({ where: { id: seller.id } });
      }
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
    vi.restoreAllMocks();
  });

  it('creates a product for authenticated seller', async () => {
    const payload = {
      vendorId: vendor.id,
      title: 'E2E Product',
      priceCents: 2500,
    };
    const res = await request(app)
      .post('/api/v1/products')
      .send(payload)
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    const created = res.body?.data;
    expect(created).toBeTruthy();
    expect(created.vendorId).toBe(vendor.id);

    // verify in database
    const dbProduct = await prisma.product.findUnique({
      where: { id: created.id },
    });
    expect(dbProduct).not.toBeNull();
    expect(dbProduct?.title).toBe('E2E Product');
  });
});
