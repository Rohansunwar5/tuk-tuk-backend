import mongoose from "mongoose";

export enum IPayoutStatus {
    PROCESSING = 'processing',
    PROCESSED = 'processed',
    FAILED = 'failed',
    REVERSED = 'reversed',
}

export enum IPayoutMethod {
    UPI = 'upi',
    BANK_ACCOUNT = 'bank_account',
}

const payoutSchema = new mongoose.Schema(
    {
    driverId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    payoutId: {
        type: String, // Razorpayout payout ID
        required: true,
    },
    amount: {
        type: Number,
        required: true, 
        min: 0,
    },
    fees: {
        type: Number,
        default: 0,
    },
    method: {
        type: String,
        enum: IPayoutMethod,
        required: true,
    },
    status: {
        type: String,
        enum: IPayoutStatus,
        default: IPayoutStatus.PROCESSING,
    },
    accountDetails: {
        upiId: String,
        accountNumber: String,
        ifscCode: String, 
        accountHolderName: String,
    },
    razorpayFundAccountId: String,
    notes: {
        type: Object,
    }
}, { timestamps: true });

payoutSchema.index({ payoutId: 1 });
payoutSchema.index({ driverId: 1, status: 1 });

export interface IPayout extends mongoose.Document{
    driverId: string;
    payoutId: string;
    amount: number;
    fees: number;
    method: IPayoutMethod;
    status: IPayoutStatus;
    accountDetails: {
        upiId?: string;
        accountNumber?: string;
        ifscCode?: string;
        accountHolderName?: string;
    };
    razorpayFundAccountId?: string;
    notes?: object;
}

export default mongoose.model<IPayout>('Payout', payoutSchema);