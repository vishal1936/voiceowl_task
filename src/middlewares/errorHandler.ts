import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../controllers/taskController';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('Unhandled error:', err);

  const response: ApiResponse = {
    success: false,
    message: 'Internal server error',
  };

  res.status(500).json(response);
};