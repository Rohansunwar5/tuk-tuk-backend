import mongoose from 'mongoose';


export enum ISessionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    FAILED = 'failed'
}

const pairingAttemptSchema = new mongoose.Schema({
    sessionToken: {
        type: String,
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        required: true,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: ISessionStatus,
        default: ISessionStatus.PENDING
    },
    verificationAttempts: {
        type: Number,
        default: 0,
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30*60*1000),
        index: { expires: '10m' }
    }
}, { timestamps: true })

pairingAttemptSchema.index({ deviceId: 1, status: 1 })
pairingAttemptSchema.index({ driverId: 1, status: 1 })

export interface IPairingAttempt extends mongoose.Schema {
    sessionToken: string;
    deviceId: string;
    driverId: mongoose.Types.ObjectId;
    status?: string;
    verificationAttempts?: Number;
    expiresAt?: Date; 
}

export default mongoose.model<IPairingAttempt>('PairingAttempt', pairingAttemptSchema);