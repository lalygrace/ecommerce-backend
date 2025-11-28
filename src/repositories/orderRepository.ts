import { prisma } from '../db/prisma.js';
import type { CreateOrderDtoType } from '../dtos/order.dto.js';

export const createOrder = async (data: CreateOrderDtoType) => {
  // Create order with nested items in a single transaction
  const prismaData: any = {
    totalCents: data.totalCents,
    shippingAddress: data.shippingAddress ?? null,
    couponCode: data.couponCode ?? null,
  };
  if (data.customerId !== undefined) prismaData.customerId = data.customerId;
  prismaData.items = {
    create: data.items.map((it) => ({
      productId: it.productId,
      vendorId: it.vendorId,
      title: it.title,
      unitPriceCents: it.unitPriceCents,
      quantity: it.quantity,
      image: it.image ?? null,
      variantSku: it.variantSku ?? null,
    })),
  };

  const rec = await prisma.order.create({
    data: prismaData,
    include: { items: true },
  });
  return rec;
};

export const findOrderById = async (id: string) =>
  prisma.order.findUnique({ where: { id }, include: { items: true } });

export const findOrders = async (opts: {
  page: number;
  limit: number;
  customerId?: string;
  status?: string;
}) => {
  const where: any = {};
  if (opts.customerId) where.customerId = opts.customerId;
  if (opts.status) where.status = opts.status;
  const skip = (opts.page - 1) * opts.limit;
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      take: opts.limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
  ]);
  return { total, items };
};

export const updateOrder = async (id: string, data: any) =>
  prisma.order.update({ where: { id }, data });

export const deleteOrder = async (id: string) =>
  prisma.order.delete({ where: { id } });
