import JWT from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../errors/bad-request.error';
import { encodedJWTCacheManager } from '../../services/cache/entities';
import { UnauthorizedError } from '../../errors/unauthorized.error';
import { decode, encode, encryptionKey } from '../../services/crypto.service';
import config from '../../config';
import { UserRepository } from '../../repository/user.repository';

const userRepository = new UserRepository();

interface IJWTVerifyPayload {
  _id: string;
  email: string;
  twoFactorVerified?: boolean;
}

const getAuthMiddlewareByJWTSecret = (jwtSecret: string) => async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestError('Authorization header is missing');
    }

    // 2. Extract and verify token
    const token = authHeader.split(' ')[1];
    if (!token) throw new BadRequestError('Token is missing or invalid');
    
    const decoded = JWT.verify(token, jwtSecret) as IJWTVerifyPayload;
    if (!decoded._id || !decoded.email) {
      throw new UnauthorizedError('Invalid token payload');
    }

    const { _id, email } = decoded;

    const user = await userRepository.getUserById(_id);
    if (!user) throw new UnauthorizedError('User not found');

    const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
    const cachedJWT = await encodedJWTCacheManager.get({ userId: _id });

    if (!cachedJWT) {
      const encryptedData = await encode(token, key);
      await encodedJWTCacheManager.set({ userId: _id }, encryptedData);
    } else if (cachedJWT) {
      const decodedJWT = await decode(cachedJWT, key);
      if (decodedJWT !== token) {
        throw new UnauthorizedError('Session Expired!');
      }
    }

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      twoFactorEnabled: user.twoFactorEnabled
    };
    
    next();
  } catch (error) {
    if (error instanceof JWT.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (error instanceof JWT.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export default getAuthMiddlewareByJWTSecret;