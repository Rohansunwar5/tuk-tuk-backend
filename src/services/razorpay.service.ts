import Razorpay from 'razorpay';
import config from '../config';
import { UnprocessableError } from '../errors/unprocessable.error';

// Use type assertion directly when accessing the properties
const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
});

class RazorpayService {
    async createFundAccount(params: {
         method: 'upi' | 'bank_account';
        upiId?: string;
        accountNumber?: string;
        ifscCode?: string;
        accountHolderName?: string;
        contactId: string;
        email?: string;
        name: string;
    }) {
        const fundAccountParams: any = {
            customer_id: params.contactId,
            account_type: params.method
        };
        
        if(params.method === 'upi') {
            fundAccountParams.vpa = { address: params.upiId };
        } else {
            fundAccountParams.bank_account = { name: params.accountHolderName, ifsc: params.ifscCode, account_number: params.accountNumber };
        };
        
        // Use type assertion for this specific call
        const fundAccount = await (razorpay.fundAccount as any).create(fundAccountParams);
        if(!fundAccount.id) throw new UnprocessableError('Fund account creation failed');
        
        return fundAccount.id;
    }
    
    async createPayout(params: {
        amount: number;
        currency: string;
        fundAccountId: string; // This must be a string, not undefined
        mode: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS';
        purpose: string;
        referenceId: string;
    }) {
        // Use type assertion for this specific call
        const payout = await (razorpay as any).payouts.create({
            account_number: config.RAZORPAY_SETTLEMENT_ACCOUNT,
            fund_account_id: params.fundAccountId,
            amount: params.amount * 100,
            currency: params.currency,
            mode: params.mode,
            purpose: params.purpose,
            reference_id: params.referenceId,
            queue_if_low_balance: true,
        });
        
        if(!payout) throw new UnprocessableError('Payout creation failed');
        
        return payout;
    }
    
    async getPayoutStatus(payoutId: string) {
        // Use type assertion for this specific call
        return (razorpay as any).payouts.fetch(payoutId);
    }

    async validateWebhookSignature(body: string | object, signature: string, secret: string) {
        const crypto = require('crypto');
        
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyString)
            .digest('hex');
            
        return expectedSignature === signature;
    }
}

export default new RazorpayService();