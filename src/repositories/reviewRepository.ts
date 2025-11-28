import { prisma } from '../db/prisma.js';
import type {
  CreateReviewDtoType,
  UpdateReviewDtoType,
} from '../dtos/review.dto.js';

export const createReview = async (
  data: CreateReviewDtoType & { userId: string },
) => {
  // create review and update product aggregates in a transaction
  const rec = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({ data });

    // recompute average rating and count for product
    const agg = await tx.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const avg = agg._avg.rating ?? null;
    const count = agg._count.id ?? 0;

    await tx.product.update({
      where: { id: data.productId },
      data: { rating: avg, reviewCount: count },
    });

    return created;
  });

  return rec;
};

export const findReviewById = async (id: string) =>
  prisma.review.findUnique({ where: { id } });

export const findReviews = async (opts: {
  page: number;
  limit: number;
  productId?: string;
  userId?: string;
}) => {
  const where: any = {};
  if (opts.productId) where.productId = opts.productId;
  if (opts.userId) where.userId = opts.userId;
  const skip = (opts.page - 1) * opts.limit;
  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip,
      take: opts.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { total, items };
};

export const updateReview = async (id: string, data: UpdateReviewDtoType) =>
  prisma.review.update({ where: { id }, data });

export const deleteReview = async (id: string) =>
  prisma.review.delete({ where: { id } });
