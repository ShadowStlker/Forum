import { Request, Response, NextFunction } from 'express';
import sanitize from 'xss';

/**
 * Middleware to sanitise string fields in req.body.
 * @param fields Array of field names to sanitise.
 */
export const sanitizeInput = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach((field) => {
      const value = (req.body as any)[field];
      if (typeof value === 'string') {
        (req.body as any)[field] = sanitize(value);
      }
    });
    next();
  };
};
