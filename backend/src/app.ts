import express from 'express';
import path from 'path';
import cors from 'cors';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import speechRecognitionRouter from './routes/speechRecognition';
import plannerRouter from './routes/planner';
import expensesRouter from './routes/expenses';
import errorHandler from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/speech', speechRecognitionRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/expenses', expensesRouter);

// Static assets (serve built front-end)
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default app;
