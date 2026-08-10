import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    issuedBy: { type: String, trim: true, default: '' },
    issuedAt: { type: Date },
    fileUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

CertificateSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Certificate ||
  mongoose.model('Certificate', CertificateSchema);
