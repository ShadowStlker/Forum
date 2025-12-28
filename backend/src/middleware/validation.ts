import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validatePost = [
  body('title')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 chars'),
  body('body')
    .isString()
    .withMessage('Body must be a string')
    .isLength({ min: 1 })
    .withMessage('Body cannot be empty'),
];

export const validationErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  }
  next();
};

export const validateReply = [
  body('body')
    .isString()
    .withMessage('Reply body must be a string')
    .isLength({ min: 1 })
    .withMessage('Reply body cannot be empty'),
  body('parentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('parentId must be a positive integer'),
];

export const validateUsername = [
  body('username')
    .isString()
    .withMessage('Username must be a string')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 chars'),
];

