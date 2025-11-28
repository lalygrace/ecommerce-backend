import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsQuery,
} from '../dtos/product.dto.js';
import * as productController from '../controllers/productController.js';

const router = Router();

router.post(
  '/',
  validateRequest(CreateProductDto),
  productController.createProduct,
);
router.get(
  '/',
  validateRequest(ListProductsQuery, { target: 'query' }),
  productController.listProducts,
);
router.get('/:id', productController.getProduct);
router.put(
  '/:id',
  validateRequest(UpdateProductDto),
  productController.updateProduct,
);
router.delete('/:id', productController.deleteProduct);

export default router;
