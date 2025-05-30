import { Router } from 'express';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { asyncHandler } from '../utils/asynchandler';
import { calculateDailyEarnings, getDriverEarnings } from '../controllers/earnings.controller';

const earningsRoute = Router();

earningsRoute.get('/driver/:driverId', isLoggedIn, asyncHandler(getDriverEarnings));
earningsRoute.get('/calculate-daily', isLoggedIn, asyncHandler(calculateDailyEarnings));

export default earningsRoute