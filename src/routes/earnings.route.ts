import { Router } from 'express';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { asyncHandler } from '../utils/asynchandler';
import { calculateDailyEarnings, getDriverEarnings } from '../controllers/earnings.controller';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';

const earningsRoute = Router();

earningsRoute.get('/driver/:driverId', isLoggedIn, asyncHandler(getDriverEarnings));
earningsRoute.get('/calculate-daily', isAdminLoggedIn, asyncHandler(calculateDailyEarnings));

export default earningsRoute