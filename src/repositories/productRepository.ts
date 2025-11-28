import { prisma } from '../db/prisma.js';
import type {
  CreateProductDtoType,
  UpdateProductDtoType,
} from '../dtos/product.dto.js';

const makeSlug = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

export const createProduct = async (data: CreateProductDtoType) => {
  const slug = data.slug ?? makeSlug(data.title);

  const prismaData = {
    vendorId: data.vendorId,
    title: data.title,
    slug,
    description: data.description ?? null,
    priceCents: data.priceCents,
    originalPriceCents: data.originalPriceCents ?? null,
    stock: data.stock ?? 0,
    shippingFeeCents: data.shippingFeeCents ?? null,
    deliveryTime: data.deliveryTime ?? null,
    rating: null,
    reviewCount: 0,
    image: data.image ?? null,
    images: data.images ?? [],
    categorySlugs: data.categorySlugs ?? [],
    status: (data.status as any) ?? 'ACTIVE',
  };

  const product = await prisma.product.create({ data: prismaData });
  return product;
};

export const findProductById = async (id: string) => {
  return prisma.product.findUnique({ where: { id } });
};

export const findProducts = async (opts: {
  page: number;
  limit: number;
  q?: string;
  vendorId?: string;
  category?: string;
  status?: string;
}) => {
  const { page, limit, q, vendorId, category, status } = opts;
  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (vendorId) where.vendorId = vendorId;
  if (status) where.status = status;
  if (category) where.categorySlugs = { has: category };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
};

export const updateProduct = async (id: string, data: UpdateProductDtoType) => {
  const prismaData: any = {};
  if (data.vendorId !== undefined) prismaData.vendorId = data.vendorId;
  if (data.title !== undefined) prismaData.title = data.title;
  if (data.slug !== undefined) prismaData.slug = data.slug;
  if (data.description !== undefined) prismaData.description = data.description;
  if (data.priceCents !== undefined) prismaData.priceCents = data.priceCents;
  if (data.originalPriceCents !== undefined)
    prismaData.originalPriceCents = data.originalPriceCents;
  if (data.stock !== undefined) prismaData.stock = data.stock;
  if (data.shippingFeeCents !== undefined)
    prismaData.shippingFeeCents = data.shippingFeeCents;
  if (data.deliveryTime !== undefined)
    prismaData.deliveryTime = data.deliveryTime;
  if (data.image !== undefined) prismaData.image = data.image;
  if (data.images !== undefined) prismaData.images = data.images;
  if (data.categorySlugs !== undefined)
    prismaData.categorySlugs = data.categorySlugs;
  if (data.status !== undefined) prismaData.status = data.status as any;

  return prisma.product.update({ where: { id }, data: prismaData });
};

export const deleteProduct = async (id: string) => {
  return prisma.product.delete({ where: { id } });
};
