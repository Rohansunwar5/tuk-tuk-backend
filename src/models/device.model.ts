import mongoose from 'mongoose';

export enum IStatus {
    UNPAIRED = 'unpaired',
    PAIRED = 'paired',
    MAINTENANCE = 'maintenance',
    OFFLINE = 'offline'
}

const deviceSchema = new mongoose.Schema({
    hardwareId: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    pairingLock: {
        type: Boolean,
        default: false,
    },
    initialPairingToken: {
        type: String,
        select: false,  
    },
    driverId: {
        type: mongoose.Types.ObjectId,
    },
    status: {
        type: String,
        enum: IStatus,
        default: IStatus.UNPAIRED
    },
    model: {
        type: String,
        required: true,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now
    },
    wsConnection: {
        connected: { type: Boolean, default: false },
        lastPingAt: Date
    }
}, { timestamps: true });

deviceSchema.index({ driverId: 1 });
deviceSchema.index({ hardwareId: 1, pairingLock: 1 });
deviceSchema.index({ status: 1 });

export interface IDevice extends mongoose.Schema {
    _id: mongoose.Types.ObjectId;
    hardwareId: string;
    deviceId: string;
    pairingLock?: boolean;
    initialPairingToken?: string;
    driverId?: mongoose.Types.ObjectId;
    status: string;
    model?: string;
    wsConnection?: {
        connected: boolean;
        lastPingAt?: Date;
    };
    lastSeenAt?: string; 
}

export default mongoose.model<IDevice>('Device', deviceSchema);