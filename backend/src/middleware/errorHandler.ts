import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message,
  };
  
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;