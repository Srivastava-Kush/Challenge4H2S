import express from 'express';
import { getMenu, createOrder, getOrders, createRazorpayOrder, verifyRazorpayPayment } from '../controllers/orderController.js';
import { requireAuth } from '../routes/authRoutes.js';

const router = express.Router();

router.get('/menu', getMenu);
router.post('/orders', createOrder);
router.get('/orders', requireAuth, getOrders);
router.post('/payment/create-order', createRazorpayOrder);
router.post('/payment/verify', verifyRazorpayPayment);

export default router;
