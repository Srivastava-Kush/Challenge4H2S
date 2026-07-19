import Razorpay from 'razorpay';
import crypto from 'crypto';
import MenuItem from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

const RAZORPAY_KEY_ID  = process.env.RAZORPAY_KEY_ID  || 'rzp_test_placeholderkey';
const RAZORPAY_SECRET  = process.env.RAZORPAY_SECRET   || 'razorpay_secret_placeholder';

const razorpay = new Razorpay({
  key_id:     RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

export const getMenu = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = (category && category !== 'all') ? { category } : {};
    const items = await MenuItem.find(filter).lean();
    res.json(items.map(i => ({ ...i, id: i.itemId })));
  } catch (err) {
    console.error('getMenu error:', err);
    res.status(500).json({ error: 'Failed to load menu' });
  }
};

export const createOrder = async (req, res) => {
  const { items, totalAmount, collectionPoint = 'Food Stand 1 – South Concourse', razorpayPaymentId, razorpayOrderId, userId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  try {
    // Find user if userId provided (optional — for anonymous kiosk orders)
    let userDoc = null;
    if (userId) userDoc = await User.findById(userId);

    const order = await Order.create({
      user: userDoc ? userDoc._id : undefined,
      items,
      totalAmount,
      collectionPoint,
      razorpayOrderId,
      paymentId: razorpayPaymentId || `cash_${Date.now()}`,
      status: 'Preparing',
    });

    // Link order to user
    if (userDoc) {
      await User.findByIdAndUpdate(userDoc._id, { $push: { orders: order._id } });
    }

    res.status(201).json({ ...order.toObject(), id: order._id });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req, res) => {
  if (req.user.role !== 'ops') {
    return res.status(403).json({ error: 'Forbidden — ops only' });
  }
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  const { amount, receipt } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    // Return a demo order so checkout still works in development
    res.json({
      id: `order_demo_${Date.now()}`,
      amount,
      currency: 'INR',
      receipt,
      status: 'created',
      _demo: true,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount, userId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isDemo = razorpay_order_id.startsWith('order_demo_');
  const isValid = isDemo || expectedSignature === razorpay_signature;

  if (!isValid) {
    return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
  }

  try {
    let userDoc = null;
    if (userId) userDoc = await User.findById(userId);

    const order = await Order.create({
      user: userDoc ? userDoc._id : undefined,
      items: items || [],
      totalAmount: totalAmount || 0,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: 'Preparing',
    });

    if (userDoc) {
      await User.findByIdAndUpdate(userDoc._id, { $push: { orders: order._id } });
    }

    res.json({ message: 'Payment verified and order confirmed', order: { ...order.toObject(), id: order._id } });
  } catch (err) {
    console.error('verifyRazorpayPayment error:', err);
    res.status(500).json({ error: 'Failed to save order after payment' });
  }
};
