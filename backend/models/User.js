import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['fan', 'ops', 'volunteer'], default: 'fan' },
  status:    { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
  location:  { type: String },
  authProvider: { type: String, default: 'mongo' },
  orders:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save (Mongoose 6+ — async pre hooks resolve via promise, no next() needed)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password to hash
userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
