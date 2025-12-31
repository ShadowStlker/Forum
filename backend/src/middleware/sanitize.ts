import { Request, Response, NextFunction } from 'express';
import sanitize from 'xss';

/**
 * Middleware to sanitise string fields in req.body.
 * @param fields Array of field names to sanitise.
 */
export const sanitizeInput = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize body fields
    fields.forEach((field) => {
      const value = (req.body as any)[field];
      if (typeof value === 'string') {
        (req.body as any)[field] = sanitize(value);
      }
    });
    
    // Sanitize query parameters (if any)
    Object.keys(req.query).forEach((queryParam) => {
      const value = (req.query as any)[queryParam];
      if (typeof value === 'string') {
        (req.query as any)[queryParam] = sanitize(value);
      }
    });
    
    // Sanitize URL path segments (if any)
    if (req.params && Object.keys(req.params).length > 0) {
      Object.keys(req.params).forEach((param) => {
        const value = (req.params as any)[param];
        if (typeof value === 'string') {
          (req.params as any)[param] = sanitize(value);
        }
      });
    }
    
    next();
  };
};
