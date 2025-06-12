import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { adminLogin, adminProfile, adminSignup, generateResetPasswordLink, resetPassword, verifyResetPasswordCode } from "../controllers/admin.controller";
import isAdminLoggedIn from "../middlewares/isAdminLoggedIn.middleware";

const adminRouter = Router();

adminRouter.post('/login', asyncHandler(adminLogin));
adminRouter.post('/signup', asyncHandler(adminSignup));
adminRouter.get('/profile', isAdminLoggedIn, asyncHandler(adminProfile));
adminRouter.post('/reset-password', asyncHandler(generateResetPasswordLink));
adminRouter.get('/reset-password/:code', asyncHandler(verifyResetPasswordCode));
adminRouter.patch('/reset-password/:code', asyncHandler(resetPassword));

export default adminRouter;