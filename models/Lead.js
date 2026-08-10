import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    bytes: { type: Number },
  },
  { _id: false }
);

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: '' },
    product: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    materialGrade: { type: String, trim: true, default: '' },
    formFactor: { type: String, trim: true, default: '' },
    quantity: { type: String, trim: true, default: '' },
    dimensions: { type: String, trim: true, default: '' },
    requiredStandard: { type: String, trim: true, default: '' },
    deliveryLocation: { type: String, trim: true, default: '' },
    additionalRequirements: { type: String, trim: true, default: '' },
    needsTC: { type: Boolean, default: false },
    needsNabl: { type: Boolean, default: false },
    needsUT: { type: Boolean, default: false },
    attachments: [AttachmentSchema],
    source: { type: String, default: 'contact' },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'quoted', 'closed', 'spam'],
      default: 'new',
    },
    internalNotes: { type: String, default: '' },
    quotationNotes: { type: String, default: '' },
    quotationFileUrl: { type: String, default: '' },
    quotationValidity: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    ipHash: { type: String, default: '' },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
