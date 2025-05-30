import { Router } from 'express';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { asyncHandler } from '../utils/asynchandler';
import { getPayoutHistory, payoutWebhook, requestPayout } from '../controllers/payout.controller';


const paymentRouter = Router();

paymentRouter.post('/request', isLoggedIn, asyncHandler(requestPayout));
paymentRouter.get('/history', isLoggedIn, asyncHandler(getPayoutHistory));
paymentRouter.post('/webhook', asyncHandler(payoutWebhook));

export default paymentRouter;