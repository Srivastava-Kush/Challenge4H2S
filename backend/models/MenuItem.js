import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: String,
  description: String,
  price: Number,
  priceDisplay: String,
  category: String,
  tags: [String],
  emoji: String,
  available: { type: Boolean, default: true },
  prepTime: Number,
  stand: String
});

export default mongoose.model('MenuItem', menuItemSchema);
