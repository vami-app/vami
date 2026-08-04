import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'EDITOR'],
      default: 'SUPER_ADMIN',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
