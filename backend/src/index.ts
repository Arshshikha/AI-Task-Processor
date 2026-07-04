import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, connectRedis, redisClient } from './config/db';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and CORS middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.FRONTEND_URL,
      ].filter(Boolean) as string[];

      const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
      
      if (allowedOrigins.includes(origin) || isLocalhost) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// API Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoints for Kubernetes
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/readyz', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const redisStatus = redisClient.isOpen ? 'UP' : 'DOWN';

  if (dbStatus === 'UP' && redisStatus === 'UP') {
    res.status(200).json({ status: 'UP', db: dbStatus, redis: redisStatus });
  } else {
    res.status(503).json({ status: 'DOWN', db: dbStatus, redis: redisStatus });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('AI Task Processing Platform API is running.');
});

// Start server
const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
