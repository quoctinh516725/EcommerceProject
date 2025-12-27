import { Request, Response } from 'express';
import { NotFoundError } from '../errors/AppError';

export const notFoundHandler = (req: Request, res: Response) => {
  throw new NotFoundError(`Route ${req.originalUrl} not found`);
};

