import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  confirm2FA,
  disable2FA,
  genericLogin, profile, setup2FA, signup,
  verify2FA, 
} from '../controllers/auth.controller';
import { loginValidator,signupValidator} from '../middlewares/validators/auth.validator';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { verifyTempToken } from '../middlewares/verifyTempToken.middleware';

const authRouter = Router();

authRouter.post('/login', loginValidator, asyncHandler(genericLogin));
authRouter.post('/signup', signupValidator, asyncHandler(signup));
authRouter.get('/profile', isLoggedIn, asyncHandler(profile));

//2FA 
authRouter.post('/2fa/setup', isLoggedIn, asyncHandler(setup2FA));
authRouter.post('/2fa/confirm', isLoggedIn, asyncHandler(confirm2FA));
authRouter.post('/2fa/verify', verifyTempToken ,asyncHandler(verify2FA));
authRouter.post('/2fa/disable', isLoggedIn, asyncHandler(disable2FA));

export default authRouter;