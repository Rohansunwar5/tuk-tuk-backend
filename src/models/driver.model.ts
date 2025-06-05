import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 40,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 40,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    vehicleNumber: {
        type: String,
        uppercase: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastPayoutAt: Date,
    otpHash: {
        type: String,
        select: false,
    },
    otpExpiry: {
        type: Date,
    },
    otpAttempts: {
        type: Number,
        default: 0,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    lastLogin: {
        type: Date,
    },
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    location: {
        type: String,
    },
    razorpayContactId: {
        type: String,
    },
    razorpayFundAccountId: {
        type: String,
    }
}, { timestamps: true });

driverSchema.index({ vehicleNumber: 1 });
driverSchema.index({ refreshToken: 1 });

export interface IDriver extends mongoose.Schema {
    _id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    vehicleNumber: string;
    balance: number;
    lastPayoutAt?: Date;
    otpHash?: string;
    otpExpiry?: Date;
    refreshToken?: string;
    lastLogin?: Date;
    profileCompleted?: boolean;
    location?: string;
    razorpayContactId?: string;
    razorpayFundAccountId?: string;
}

export default mongoose.model<IDriver>('Driver', driverSchema);