import mongoose, { Schema, Document, Types } from 'mongoose';

interface IDetectionLogResult {
  bbox_normalized: [number, number, number, number];
  class_id: number;
  class_name: string;
  confidence: number;
}

export interface IHistoryLog extends Document {
  userId: Types.ObjectId;
  type: 'detection' | 'training_upload';
  status: 'pending' | 'processing' | 'success' | 'failure' | 'partial_success';
  timestamp: Date;
  detectionSource?: 'upload' | 'live_frame';
  originalFilename?: string;
  detectionResults?: IDetectionLogResult[];
  trainingLabel?: string;
  trainingFileCount?: number;
  trainingOriginalFilenames?: string[];
  imageData?: string | string[];
  errorMessage?: string;
}

const HistoryLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['detection', 'training_upload'], required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failure', 'partial_success'],
    required: true,
    default: 'pending',
  },
  timestamp: { type: Date, default: Date.now, index: true },

  detectionSource: { type: String, enum: ['upload', 'live_frame'] },
  originalFilename: { type: String },
  detectionResults: [{
    bbox_normalized: { type: [Number], required: true },
    class_id: { type: Number, required: true },
    class_name: { type: String, required: true },
    confidence: { type: Number, required: true },
  }],

  trainingLabel: { type: String },
  trainingFileCount: { type: Number },
  trainingOriginalFilenames: [{ type: String }],
  imageData: { type: Schema.Types.Mixed },
  errorMessage: { type: String },
});

export default mongoose.models.HistoryLog || mongoose.model<IHistoryLog>('HistoryLog', HistoryLogSchema);