import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';

/**
 * Validate pagination query parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  if (page < 1) {
    throw new ValidationError('Page must be greater than 0');
  }
  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
};

/**
 * Validate price range query parameters
 */
export const validatePriceRange = (req: Request, res: Response, next: NextFunction) => {
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

  if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
    throw new ValidationError('minPrice must be a valid positive number');
  }
  if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
    throw new ValidationError('maxPrice must be a valid positive number');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ValidationError('minPrice must be less than or equal to maxPrice');
  }

  next();
};

/**
 * Validate sortBy parameter
 */
export const validateSortBy = (req: Request, res: Response, next: NextFunction) => {
  const validSortOptions = ['relevance', 'price_asc', 'price_desc', 'rating_desc', 'created_at_desc'];
  const sortBy = req.query.sortBy as string;

  if (sortBy && !validSortOptions.includes(sortBy)) {
    throw new ValidationError(
      `sortBy must be one of: ${validSortOptions.join(', ')}`
    );
  }

  next();
};

/**
 * Validate UUID format
 * If not a valid UUID, pass to next route (for slug-based routes)
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuid && !uuidRegex.test(uuid)) {
      // If it's not a UUID, it might be a slug - pass to next route handler
      // This allows /products/:id to work with UUIDs and /products/:slug to work with slugs
      return next('route');
    }
    
    next();
  };
};


