import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';
import healthRouter from './routes/health';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/health', healthRouter);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default app;