import request from 'supertest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { app } from '../src/app.js';
import { auth } from '../src/utils/auth.js';
import * as sellerService from '../src/services/sellerService.js';
import * as vendorRepo from '../src/repositories/vendorRepository.js';
import * as productService from '../src/services/productService.js';

describe('Products API', () => {
  it('should reject unauthenticated product creation', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({
        vendorId: 'd93bbb86-31ab-49d9-977b-f8b25e347d16',
        title: 'Test',
        priceCents: 1000,
      })
      .set('Accept', 'application/json');

    expect([401, 403]).toContain(res.status);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows authenticated seller to create product', async () => {
    // Mock session to simulate authenticated user
    (auth as any).api.getSession = async () => ({
      user: { id: 'test-user-1' },
    });

    // Mock seller lookup and vendor lookup to match ownership
    vi.spyOn(sellerService, 'getSellerByUserId').mockResolvedValue({
      id: 'seller-1',
      userId: 'test-user-1',
    } as any);
    vi.spyOn(vendorRepo, 'findVendorById').mockResolvedValue({
      id: 'vendor-1',
      sellerId: 'seller-1',
    } as any);

    // Mock product service to avoid touching the database in unit/integration mix test
    const fakeProduct = {
      id: 'p1',
      vendorId: 'vendor-1',
      title: 'Seeded Product',
      slug: 'seeded-product',
      description: null,
      priceCents: 1500,
      originalPriceCents: null,
      stock: 0,
      shippingFeeCents: null,
      deliveryTime: null,
      rating: null,
      reviewCount: 0,
      image: null,
      images: [],
      categorySlugs: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    vi.spyOn(productService, 'createProduct').mockResolvedValue(fakeProduct);

    const res = await request(app)
      .post('/api/v1/products')
      .send({ vendorId: 'vendor-1', title: 'Seeded Product', priceCents: 1500 })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body?.data?.id).toBe('p1');
    expect(res.body?.data?.vendorId).toBe('vendor-1');
  });
});
