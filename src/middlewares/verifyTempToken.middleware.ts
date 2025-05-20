import JWT from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { UnauthorizedError } from '../errors/unauthorized.error';

interface ITempTokenPayload {
  phoneNumber: string;
  temp: boolean;
}

export const verifyTempToken = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers['x-temp-token'] as string;
    if (!token) throw new BadRequestError('Temporary token required');

    const decoded = JWT.verify(token, config.JWT_SECRET) as ITempTokenPayload;
    
    if (!decoded.temp) throw new UnauthorizedError('Invalid temporary token');

    req.tempAuth = {
      phoneNumber: decoded.phoneNumber
    };
    
    next();
  } catch (error) {
    next(error);
  }
};