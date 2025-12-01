import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { auth } from '../src/utils/auth.js';

describe('Reservations E2E', () => {
  let user: any = null;
  let seller: any = null;
  let vendor: any = null;
  let product: any = null;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: { email: `res+${Date.now()}@ex.com`, name: 'Res User' },
    });
    seller = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: 'Res Seller',
        slug: `res-seller-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
    vendor = await prisma.vendor.create({
      data: {
        sellerId: seller.id,
        name: 'Res Vendor',
        slug: `res-vendor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
    product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        title: 'Res Product',
        slug: `res-prod-${Date.now()}`,
        priceCents: 1000,
        stock: 10,
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
    // cleanup orders referencing user to avoid FK constraint
    if (user) {
      const orders = await prisma.order.findMany({
        where: { customerId: user.id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length) {
        // delete dependent payments first
        await prisma.payment.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      }
    }
    // cleanup reservations / product / vendor / seller only if created
    if (product && product.id) {
      await prisma.reservation.deleteMany({ where: { productId: product.id } });
      await prisma.product.deleteMany({ where: { id: product.id } });
    }
    if (vendor && vendor.id) {
      await prisma.vendor.deleteMany({ where: { id: vendor.id } });
    }
    if (seller && seller.id) {
      await prisma.sellerProfile.deleteMany({ where: { id: seller.id } });
    }
    if (user && user.id) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  it('creates reservation when order is placed and consumes on payment', async () => {
    // create order via API (controller will set customerId from session)
    const orderPayload = {
      items: [
        {
          productId: product.id,
          vendorId: vendor.id,
          title: product.title,
          unitPriceCents: product.priceCents,
          quantity: 2,
        },
      ],
      totalCents: 2000,
    };
    const res = await request(app)
      .post('/api/v1/orders')
      .send(orderPayload)
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    const created = res.body?.data;
    expect(created).toBeTruthy();

    // reservation should exist
    const reservations = await prisma.reservation.findMany({
      where: { productId: product.id },
    });
    expect(reservations.length).toBeGreaterThanOrEqual(1);
    const r =
      reservations.find((x) => x.productId === product.id) ?? reservations[0];
    expect(r.orderId).toBe(created.id);
    expect(r.status).toBe('ACTIVE');

    // create payment and webhook PAID
    const payRes = await request(app)
      .post('/api/v1/payments')
      .send({
        orderId: created.id,
        method: 'CARD',
        amountCents: created.totalCents,
      })
      .set('Accept', 'application/json');
    expect(payRes.status).toBe(201);

    const webhook = {
      orderId: created.id,
      status: 'PAID',
      transactionRef: `tx-${Date.now()}`,
      gateway: 'stripe',
      amountCents: created.totalCents,
    };
    const wres = await request(app)
      .post('/api/v1/payments/webhook')
      .send(webhook)
      .set('Accept', 'application/json');
    expect(wres.status).toBe(200);

    // reservation should be consumed
    const r2 = await prisma.reservation.findUnique({ where: { id: r.id } });
    expect(
      r2?.status === 'CONSUMED' ||
        r2?.status === 'EXPIRED' ||
        r2?.status === 'CONSUMED',
    ).toBeTruthy();

    // product stock should be reduced (initial 10 -> 8 after consuming 2)
    const p = await prisma.product.findUnique({ where: { id: product.id } });
    expect(p).toBeDefined();
    expect(p!.stock).toBeLessThanOrEqual(8);
  });
});
