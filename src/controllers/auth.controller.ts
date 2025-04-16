import { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service';
import { UnauthorizedError } from '../errors/unauthorized.error';
import twoFactorAuthService from '../services/2fa.service';

export const genericLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const response = await authService.login({ email, password });

  next(response);
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password } = req.body;
  const response = await authService.signup({ firstName, lastName, email, password });

  next(response);
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.profile(_id);

  next(response);
};


// 2FA 
export const setup2FA = async (req: Request, res: Response, next: NextFunction) => {
  const { _id, email } = req.user;
  console.log("email", email);
  
  const response = await authService.setup2FA(_id, email);
  next(response);
};

export const confirm2FA = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const { code, secret } = req.body;
  const response = await authService.confirm2FA(_id, code, secret);

  next(response);
};

export const verify2FA = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const userId = req.tempTokenPayload?._id; // From middleware
  const response = await authService.verify2FA(userId, code);
  next(response);
};

export const disable2FA = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.disable2FA(_id);

  next(response);
};

export const getCurrentCode = async (req: Request, res: Response, next: NextFunction) => {
  const { secret } = req.body;
  const code = await twoFactorAuthService.getCurrentCode(secret);
  next({ code });
};