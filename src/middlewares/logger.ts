import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};