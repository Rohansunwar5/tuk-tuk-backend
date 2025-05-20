import { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service';

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { phoneNumber } = req.body;
  const result = await authService.initiateOTP(phoneNumber);

  next(result); 
}

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { phoneNumber, otp } = req.body;
  const tempToken  = await authService.verifyOTP(phoneNumber, otp);
  
  next(tempToken ); 
}

export const completeProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, vehicleNumber } = req.body;
  if (!req.tempAuth) {
    return next(new Error('Authentication information missing'));
  }
  const { phoneNumber } = req.tempAuth;
  const tokens = await authService.completeRegistration( phoneNumber, firstName, lastName, vehicleNumber);
  
  next(tokens);
}

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id }  = req.driver;
  const response = await authService.getProfile(_id);

  next(response);
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id }  = req.driver;
  const { firstName, lastName, vehicleNumber, location } = req.body;
  const response = await authService.updateProfile({ _id ,firstName, lastName, vehicleNumber, location });

  next(response);
}