import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  CreateOrderDto,
  ListOrdersQuery,
  UpdateOrderDto,
} from '../dtos/order.dto.js';
import * as orderController from '../controllers/orderController.js';

const router = Router();

router.post('/', validateRequest(CreateOrderDto), orderController.createOrder);
router.get(
  '/',
  validateRequest(ListOrdersQuery, { target: 'query' }),
  orderController.listOrders,
);
router.get('/:id', orderController.getOrder);
router.put(
  '/:id',
  validateRequest(UpdateOrderDto),
  orderController.updateOrder,
);
router.delete('/:id', orderController.deleteOrder);

export default router;
