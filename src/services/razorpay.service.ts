import Razorpay from 'razorpay';
import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { UnprocessableError } from '../errors/unprocessable.error';
import { BadRequestError } from '../errors/bad-request.error';

// Standard Razorpay instance for regular operations
const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
});

// HTTP client for RazorpayX APIs
const razorpayAPI = axios.create({
    baseURL: 'https://api.razorpay.com/v1',
    auth: {
        username: config.RAZORPAY_KEY_ID,
        password: config.RAZORPAY_KEY_SECRET
    },
    headers: {
        'Content-Type': 'application/json'
    }
});

interface ContactParams {
    name: string;
    email?: string;
    phone?: string;
    type?: 'employee' | 'vendor' | 'customer';
    reference_id?: string;
}

interface FundAccountParams {
    method: 'upi' | 'bank_account';
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    contactId: string;
    email?: string;
    name: string;
}

interface PayoutParams {
    amount: number;
    currency: string;
    fundAccountId: string;
    mode: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS';
    purpose: string;
    referenceId: string;
}

class RazorpayService {
    
    async createContact(params: ContactParams): Promise<string> {
        try {
            console.log('Creating Razorpay contact with params:', params);
            
            const response: AxiosResponse = await razorpayAPI.post('/contacts', {
                name: params.name,
                email: params.email,
                contact: params.phone,
                type: params.type || 'customer',
                reference_id: params.reference_id
            });

            console.log('Razorpay contact created successfully:', response.data);

            if (!response.data.id) {
                throw new UnprocessableError('Contact creation failed');
            }
            
            return response.data.id;

        } catch (error: any) {
            console.error('Razorpay Contact Error - Full Error:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = 'Contact creation failed';
            
            if (error.response?.data?.error?.description) {
                errorMessage = error.response.data.error.description;
            } else if (error.response?.data?.description) {
                errorMessage = error.response.data.description;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new BadRequestError(errorMessage);
        }
    }

    async createFundAccount(params: FundAccountParams): Promise<string> {
        const fundAccountParams: any = { 
            contact_id: params.contactId, 
            account_type: 'vpa' // Razorpay expects 'vpa' for UPI accounts
        };
        
        if (params.method === 'upi') {
            fundAccountParams.vpa = {
            address: params.upiId?.toLowerCase() // Ensure lowercase
            };
        } else {
            fundAccountParams.bank_account = { 
                name: params.accountHolderName, 
                ifsc: params.ifscCode, 
                account_number: params.accountNumber 
            };
            fundAccountParams.account_type = 'bank_account';
        }
        
        try {
        console.log('Creating fund account with:', fundAccountParams);
        const response = await razorpayAPI.post('/fund_accounts', fundAccountParams);
        return response.data.id;
    } catch (error: any) {
        console.error('Fund account creation error:', error.response?.data);
        throw new BadRequestError(error.response?.data?.error?.description || 'Fund account creation failed');
    }
    }
    
    async createPayout(params: PayoutParams): Promise<any> {
        try {
             const response = await razorpayAPI.post('/payouts', {
            account_number: config.RAZORPAY_SETTLEMENT_ACCOUNT,
            fund_account_id: params.fundAccountId,
            amount: params.amount * 100, // Amount in paise
            currency: params.currency || 'INR',
            mode: params.mode,
            purpose: params.purpose || 'payout',
            reference_id: params.referenceId,
            queue_if_low_balance: true,
            notes: {
                driver_id: params.referenceId.split('_')[1] // Extract driver ID
            }
        });
            
            if (!response.data) {
                throw new UnprocessableError('Payout creation failed');
            }
            
            return response.data;
        } catch (error: any) {
        console.error('Payout Error Details:', {
            url: error.config?.url,
            data: error.config?.data,
            response: error.response?.data
        });
        throw new BadRequestError(error.response?.data?.error?.description || 'Payout failed');
    }
    }
    
    async getPayoutStatus(payoutId: string): Promise<any> {
        try {
            const response: AxiosResponse = await razorpayAPI.get(`/payouts/${payoutId}`);
            return response.data;
        } catch (error: any) {
            console.error('Get Payout Status Error:', error.response?.data || error);
            throw new BadRequestError(error.response?.data?.error?.description || 'Failed to fetch payout status');
        }
    }

    async validateWebhookSignature(body: string | object, signature: string, secret: string): Promise<boolean> {
        const crypto = require('crypto');
        
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyString)
            .digest('hex');
            
        return expectedSignature === signature;
    }

    // For non-RazorpayX operations, you can still use the standard SDK
    async createOrder(params: any): Promise<any> {
        return razorpay.orders.create(params);
    }

    async capturePayment(paymentId: string, amount: number): Promise<any> {
       return razorpay.payments.capture(paymentId, amount, 'INR');
    }
}

export default new RazorpayService();