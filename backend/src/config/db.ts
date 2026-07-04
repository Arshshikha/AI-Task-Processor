import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_tasks';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully.');
  } catch (error) {
    console.error('Redis connection error:', error);
    // Do not crash the server immediately, but log it
  }
};
