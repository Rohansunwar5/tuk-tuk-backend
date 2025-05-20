import JWT from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../errors/bad-request.error';
// import { encodedJWTCacheManager } from '../../services/cache/entities';
import { UnauthorizedError } from '../../errors/unauthorized.error';
// import { decode, encode, encryptionKey } from '../../services/crypto.service';
import { DriverRepository } from '../../repository/driver.repository';


interface IDriverJWTPayload {
  _id: string;
  type: 'access' | 'refresh';
}

const getAuthMiddlewareByJWTSecret = (jwtSecret: string) => {
  const driverRepo = new DriverRepository();

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new BadRequestError('Authorization header is missing');
      }

      const token = authHeader.split(' ')[1];
      if (!token) throw new BadRequestError('Token is missing or invalid');
      
      const { _id, type } = JWT.verify(token, jwtSecret) as IDriverJWTPayload;

      // Mobile-specific verification
      const driver = await driverRepo.findById(_id);
      if (!driver) {
        throw new UnauthorizedError('Driver not found');
      }

      // For refresh tokens, verify against stored refresh token
      if (type === 'refresh' && driver.refreshToken !== token) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      req.driver = {
        _id,
        tokenType: type
      };

      next();
    } catch (error) {
      if (error instanceof JWT.TokenExpiredError) {
        throw new UnauthorizedError('Token expired. Please refresh');
      }
      next(error);
    }
  };
};
export default getAuthMiddlewareByJWTSecret;