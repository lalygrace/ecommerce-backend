import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { ApplyCouponDto, CreateCouponDto, UpdateCouponDto, ListCouponsQuery } from '../dtos/coupon.dto.js';
import * as couponController from '../controllers/couponController.js';

const router = Router();

router.post('/', validateRequest(CreateCouponDto), requireAuth, requireAdmin, couponController.createCoupon);
router.get('/', validateRequest(ListCouponsQuery, { target: 'query' }), couponController.listCoupons);
router.get('/:id', couponController.getCoupon);
router.put('/:id', validateRequest(UpdateCouponDto), requireAuth, requireAdmin, couponController.updateCoupon);
router.delete('/:id', requireAuth, requireAdmin, couponController.deleteCoupon);

// validate/apply endpoint (public)
router.post('/validate', validateRequest(ApplyCouponDto), couponController.validateCoupon);

export default router;
