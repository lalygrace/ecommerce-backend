import * as repo from '../repositories/inventoryRepository.js';
import * as productRepo from '../repositories/productRepository.js';
import type { CreateInventoryEventDtoType } from '../dtos/inventory.dto.js';

export const createInventoryEvent = async (
  data: CreateInventoryEventDtoType,
) => {
  // Persist event
  const ev = await repo.createInventoryEvent(data);

  // Apply to product stock for ADJUST, SALE, RETURN, RESERVE, RELEASE types
  // For simplicity, interpret SALE and RESERVE as decrement, RETURN and RELEASE as increment
  const delta = (() => {
    const t = data.type.toUpperCase();
    if (t === 'SALE' || t === 'RESERVE') return -Math.abs(data.quantity);
    if (t === 'RETURN' || t === 'RELEASE') return Math.abs(data.quantity);
    if (t === 'ADJUST') return data.quantity; // explicit
    return 0;
  })();

  if (delta !== 0) {
    // update product stock atomically
    const product = await productRepo.findProductById(data.productId);
    if (product) {
      const newStock = Math.max(0, (product.stock ?? 0) + delta);
      await productRepo.updateProduct(product.id, { stock: newStock } as any);
    }
  }

  return ev;
};
