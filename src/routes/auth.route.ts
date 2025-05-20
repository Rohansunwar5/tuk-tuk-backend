import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { completeProfile, profile, sendOTP, updateProfile, verifyOTP } from '../controllers/auth.controller';
import { verifyTempToken } from '../middlewares/verifyTempToken.middleware';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const authRouter = Router();

authRouter.post('/send-otp', asyncHandler(sendOTP));
authRouter.post('/verify-otp', asyncHandler(verifyOTP));
authRouter.post('/complete-profile', verifyTempToken, asyncHandler(completeProfile));
authRouter.get('/profile', isLoggedIn, asyncHandler(profile));
authRouter.patch('/update-profile', isLoggedIn, asyncHandler(updateProfile));

export default authRouter;