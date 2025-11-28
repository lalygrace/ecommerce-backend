import * as repo from '../repositories/orderRepository.js';
import type {
  CreateOrderDtoType,
  UpdateOrderDtoType,
} from '../dtos/order.dto.js';

export const createOrder = async (data: CreateOrderDtoType) =>
  repo.createOrder(data);

export const getOrderById = async (id: string) => repo.findOrderById(id);

export const listOrders = async (opts: {
  page: number;
  limit: number;
  customerId?: string;
  status?: string;
}) => repo.findOrders(opts);

export const updateOrder = async (id: string, data: UpdateOrderDtoType) =>
  repo.updateOrder(id, data);

export const deleteOrder = async (id: string) => repo.deleteOrder(id);
