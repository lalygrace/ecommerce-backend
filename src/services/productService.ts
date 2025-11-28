import * as repo from '../repositories/productRepository.js';
import type {
  CreateProductDtoType,
  UpdateProductDtoType,
} from '../dtos/product.dto.js';

export const createProduct = async (data: CreateProductDtoType) => {
  // TODO: business validations (vendor exists, permissions) can be added here
  const created = await repo.createProduct(data);
  return created;
};

export const getProductById = async (id: string) => {
  return repo.findProductById(id);
};

export const listProducts = async (opts: {
  page: number;
  limit: number;
  q?: string;
  vendorId?: string;
  category?: string;
  status?: string;
}) => {
  return repo.findProducts(opts);
};

export const updateProduct = async (id: string, data: UpdateProductDtoType) => {
  return repo.updateProduct(id, data);
};

export const deleteProduct = async (id: string) => {
  return repo.deleteProduct(id);
};
