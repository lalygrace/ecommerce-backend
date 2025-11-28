import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { auth } from '../src/utils/auth.js';

describe('Reviews E2E', () => {
  let user: any = null;
  let otherUser: any = null;
  let seller: any = null;
  let vendor: any = null;
  let product: any = null;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: { email: `rev+${Date.now()}@ex.com`, name: 'Rev User' },
    });
    otherUser = await prisma.user.create({
      data: { email: `rev2+${Date.now()}@ex.com`, name: 'Other Rev' },
    });

    seller = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: 'Rev Seller',
        slug: `rev-seller-${Date.now()}`,
      },
    });
    vendor = await prisma.vendor.create({
      data: {
        sellerId: seller.id,
        name: 'Rev Vendor',
        slug: `rev-vendor-${Date.now()}`,
      },
    });

    product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        title: 'Review Product',
        slug: `rev-product-${Date.now()}`,
        priceCents: 1000,
        stock: 5,
        images: [],
        categorySlugs: [],
      },
    });

    vi.spyOn((auth as any).api, 'getSession').mockImplementation(async () => ({
      user: { id: user.id },
    }));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // cleanup reviews, products, vendor, seller, users
    await prisma.review.deleteMany({ where: { productId: product?.id } });
    if (product) await prisma.product.deleteMany({ where: { id: product.id } });
    if (vendor) await prisma.vendor.deleteMany({ where: { id: vendor.id } });
    if (seller)
      await prisma.sellerProfile.deleteMany({ where: { id: seller.id } });
    if (user) await prisma.user.deleteMany({ where: { id: user.id } });
    if (otherUser)
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
  });

  it('creates a review for authenticated user and updates product aggregates', async () => {
    const payload = {
      productId: product.id,
      rating: 5,
      title: 'Great',
      body: 'Nice product',
    };
    const res = await request(app)
      .post('/api/v1/reviews')
      .send(payload)
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    const created = res.body?.data;
    expect(created).toBeTruthy();
    expect(created.productId).toBe(product.id);

    const db = await prisma.product.findUnique({ where: { id: product.id } });
    expect(db?.reviewCount).toBeGreaterThanOrEqual(1);
    expect(db?.rating).toBeTruthy();
  });

  it('prevents non-owner from updating a review', async () => {
    // create review as user
    const create = await request(app)
      .post('/api/v1/reviews')
      .send({ productId: product.id, rating: 4 })
      .set('Accept', 'application/json');
    expect(create.status).toBe(201);
    const id = create.body?.data?.id;

    // mock other user
    (auth as any).api.getSession = async () => ({ user: { id: otherUser.id } });
    const res = await request(app)
      .put(`/api/v1/reviews/${id}`)
      .send({ rating: 1 })
      .set('Accept', 'application/json');
    expect([401, 403]).toContain(res.status);
  });
});
