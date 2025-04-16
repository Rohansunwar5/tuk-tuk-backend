import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { BadRequestError } from '../errors/bad-request.error';

export const verifyTempToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tempToken } = req.body;
    
    // 1. Checking if token exists
    if (!tempToken) {
      throw new BadRequestError('Temporary token required');
    }

    // 2. Verifying token
    const decoded = jwt.verify(tempToken, config.JWT_SECRET) as {
      _id: string;
      requires2FA: boolean;
    };

    // 3. Validating token structure
    if (!decoded._id || !decoded.requires2FA) {
      throw new UnauthorizedError('Invalid temporary token');
    }

    // 4. Attaching to request
    req.tempTokenPayload = decoded;
    next();
    
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Temporary token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid temporary token'));
    } else {
      next(error);
    }
  }
};