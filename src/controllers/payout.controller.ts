import { NextFunction, Request, Response } from 'express';
import payoutService from '../services/payout.service';
import config from '../config';

export const requestPayout = async (req: Request, res: Response, next: NextFunction) => {
    const { amount, method, accountDetails } = req.body;
    const { _id } = req.driver; 
    const response = await payoutService.initPayout({ driverId: _id, amount, method, accountDetails });

    next(response);
}

export const payoutWebhook = async (req: Request, res: Response, next: NextFunction) => { 
    const signature = req.headers['x-razorpay-signature'];
    
    try {
        const result = await payoutService.handleRazorpayWebhook({
            payload: req.body,
            signature: signature as string,
            secret: config.RAZORPAY_WEBHOOK_SECRET
        });
        
        res.status(200).send('OK');
    } catch (error) {
        res.status(400).send('Invalid webhook data');
    }
}

export const getPayoutHistory = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.driver;
  const response = await payoutService.getPayoutHistory(_id);
  
  next(response);
};