import { Schema, model } from 'mongoose';

const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    inputText: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
      enum: ['uppercase', 'lowercase', 'reverse', 'word_count'],
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed'],
      default: 'pending',
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    logs: {
      type: String,
      default: '',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes to optimize query performance for user tasks and list pagination
TaskSchema.index({ user: 1, createdAt: -1 });

export const Task = model('Task', TaskSchema);
