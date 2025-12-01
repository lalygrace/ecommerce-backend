import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { CreateInventoryEventDto } from '../dtos/inventory.dto.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = Router();

router.post(
  '/',
  validateRequest(CreateInventoryEventDto),
  requireAdmin,
  inventoryController.createEvent,
);

export default router;
