import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { redisClient } from '../config/db';

const router = Router();

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Create and run a task (clicks "Run Task")
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, inputText, operation } = req.body;

    if (!title || !inputText || !operation) {
      return res.status(400).json({ message: 'Title, inputText, and operation are required.' });
    }

    if (!['uppercase', 'lowercase', 'reverse', 'word_count'].includes(operation)) {
      return res.status(400).json({ message: 'Invalid operation type.' });
    }

    // 1. Create a task record with status Pending
    const task = new Task({
      title,
      inputText,
      operation,
      status: 'pending',
      user: req.user?.id,
      logs: `[${new Date().toISOString()}] Task created. Status set to Pending.\n`,
    });

    await task.save();

    // 2. Push task ID to Redis queue
    try {
      await redisClient.lPush('task_queue', task._id.toString());
      task.logs += `[${new Date().toISOString()}] Task successfully enqueued to Redis.\n`;
      await task.save();
    } catch (redisError) {
      console.error('Failed to push task to Redis:', redisError);
      task.status = 'failed';
      task.logs += `[${new Date().toISOString()}] Failed to enqueue task to Redis: ${redisError}\n`;
      await task.save();
      return res.status(500).json({
        message: 'Task created but failed to enqueue to Redis queue.',
        task,
      });
    }

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Retrieve all tasks for the logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ user: req.user?.id }).sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Retrieve task by ID (for logs, result, status)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user?.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Retry a failed or stopped task
router.post('/:id/retry', async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user?.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    task.status = 'pending';
    task.result = null;
    task.logs += `[${new Date().toISOString()}] Task retried by user. Status set to Pending.\n`;
    await task.save();

    try {
      await redisClient.lPush('task_queue', task._id.toString());
      task.logs += `[${new Date().toISOString()}] Task re-enqueued to Redis.\n`;
      await task.save();
    } catch (redisError) {
      console.error('Failed to push task to Redis during retry:', redisError);
      task.status = 'failed';
      task.logs += `[${new Date().toISOString()}] Failed to re-enqueue task to Redis.\n`;
      await task.save();
      return res.status(500).json({
        message: 'Failed to queue task on retry.',
        task,
      });
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('Retry task error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

export default router;
