import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id:   { type: String, required: true },
  name: { type: String },
  qty:  { type: Number, required: true, min: 1 },
  price: { type: Number }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items:           [orderItemSchema],
  totalAmount:     { type: Number, required: true },
  collectionPoint: { type: String, default: 'Food Stand 1 – South Concourse' },
  status: {
    type: String,
    enum: ['Preparing', 'Ready', 'Collected'],
    default: 'Preparing'
  },
  paymentId:       { type: String, required: true },
  razorpayOrderId: { type: String },
  createdAt:       { type: Date, default: Date.now }
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
