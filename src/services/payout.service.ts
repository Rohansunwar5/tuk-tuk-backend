import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { IPayoutStatus } from '../models/payout.model';
import { DriverRepository } from '../repository/driver.repository';
import { PayoutRepository } from '../repository/payout.repository';
import razorpayService from './razorpay.service';

interface ICreatePayoutParams {
    driverId: string;
    amount: number;
    method: 'upi' | 'bank_account';
    accountDetails: {
        upiId?: string; 
        accountNumber?: string;
        ifscCode?: string;
        accountHolderName?: string;
    };
}

interface IRazorpayWebhookPayload {
    event: string;
    payload: {
        payout?: {
            entity: {
                id: string;
                fees?: number;
            }
        }
    };
}

interface IWebhookHandlerParams {
    payload: IRazorpayWebhookPayload;
    signature: string;
    secret: string;
}

interface IRazorPayoutWebhook {
    payoutId: string;
    status: IPayoutStatus;
    fees?: number;
}

class PayoutService {
    constructor (
        private readonly _payoutRepository: PayoutRepository,
        private readonly _driverRepository: DriverRepository,
    ) {}

    async initPayout(params: ICreatePayoutParams) {
        const { driverId, amount, method, accountDetails } = params;

        const driver = await this._driverRepository.findById(driverId);
        if(!driver) throw new BadRequestError('Inavlid driver');
        if(driver.balance < amount) throw new BadRequestError('Insufficient balance');

        // Step 1: Create or get Razorpay contact ID
        let contactId = driver.razorpayContactId;
        if(!contactId) {
            contactId = await razorpayService.createContact({
                name: `${driver.firstName} ${driver.lastName}`,
                email: driver.email || 'driver@example.com',
                phone: driver.phoneNumber,
                type: 'customer',
                reference_id: driverId
            });

            await this._driverRepository.updateRazorpayAccount(driverId, {
                razorpayContactId: contactId
            });
        }

        if (!contactId) {
            throw new InternalServerError('Failed to create or retrieve contact ID');
        }


        //step 2: Create or get fund account Id 
        let fundAccountId = driver.razorpayFundAccountId;
        if(!fundAccountId) {
            fundAccountId = await razorpayService.createFundAccount({ 
                method,
                ...accountDetails,
                contactId: contactId,
                email: driver.email || 'test@example.com',  // Fallback email
                name: `${driver.firstName} ${driver.lastName}`
                });

                console.log('Fund Account ID:', fundAccountId);  // Log the response
                if (!fundAccountId) throw new Error('Fund account creation failed');
            }

        await this._driverRepository.updateRazorpayAccount(driverId, { 
            razorpayFundAccountId: fundAccountId
        });

        if (!fundAccountId) {
            throw new BadRequestError('Failed to create or retrieve fund account');
        }

        //Step 3: create payout
        const payout = await razorpayService.createPayout({
            amount, 
            currency: 'INR',
            fundAccountId,
            mode: method === 'upi' ? 'UPI' : 'IMPS',
            purpose: 'payout',
            referenceId: `payout_${driverId}_${Date.now()}`
        });

        console.log('Payout Request:', {
            driverId,
            amount,
            method,
            contactId,
            fundAccountId
        });

        if(!payout) throw new InternalServerError('Failed to create payout');

        const payoutRecord = await this._payoutRepository.create({
            driverId,
            payoutId: payout.id,
            amount,
            method,
            accountDetails,
            razorpayFundAccountId: fundAccountId,
            status: IPayoutStatus.PROCESSING,
        })
        
        console.log(`Initiated payout of ${amount} for driver ${driverId}`);
        await this._driverRepository.updateBalance(driverId, -amount);

        return payoutRecord;
    }

    async handleRazorpayWebhook(params: IWebhookHandlerParams) {
        const { payload, signature, secret } = params;
        
        // Verify webhook signature
        const isValid = razorpayService.validateWebhookSignature(
            JSON.stringify(payload),
            signature,
            secret
        );
        
        if (!isValid) {
            throw new BadRequestError('Invalid signature');
        }
        
        const { event } = payload;

        console.log(`Processing webhook event: ${event}`);
        
        
        if (event === 'payout.processed') {
            return await this.razorpayPayoutWebhook({
                payoutId: payload.payload.payout?.entity.id || '',
                status: IPayoutStatus.PROCESSED,
                fees: payload.payload.payout?.entity.fees ? payload.payload.payout.entity.fees / 100 : undefined
            });
        } else if (event === 'payout.reversed') {
            return await this.razorpayPayoutWebhook({
                payoutId: payload.payload.payout?.entity.id || '',
                status: IPayoutStatus.REVERSED
            });
        } else if (event === 'payout.failed') {
            return await this.razorpayPayoutWebhook({
                payoutId: payload.payload.payout?.entity.id || '',
                status: IPayoutStatus.FAILED,
            });
        }
        
        return false;
    }


    async razorpayPayoutWebhook(params: IRazorPayoutWebhook) {
        const { payoutId, status, fees } = params;

        const payout = await this._payoutRepository.getByPayoutId(payoutId);
        if(!payout) return false;

         const updateData: Partial<IRazorPayoutWebhook> = { status };
        if (fees !== null) updateData.fees = fees;

        const updatePayout = await this._payoutRepository.update(
            payoutId,
            updateData
        );

        if(!updatePayout) throw new InternalServerError('Failed to update payout record');

        if(status === IPayoutStatus.FAILED || status === IPayoutStatus.REVERSED) {
            await this._driverRepository.updateBalance(
                payout.driverId,
                payout.amount
            )
        }

        return true;
    }

    async getPayoutHistory(driverId: string) {
        return this._payoutRepository.getByDriverId(driverId);
    }
}

export default new PayoutService(
    new PayoutRepository(),
    new DriverRepository()
)
