import mongoose, { Schema } from 'mongoose';

const playLogSchema = new Schema({
    deviceId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    driverId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    adId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    startTime: {
        type: Date, 
        required: true,
    },
    endTime: {
        type: Date,
    },
    duration: {
        type: Number
    },
    processed: { 
        type: Boolean,
        default: false 
    }
}, { timestamps: true });

playLogSchema.index({ _id: 1, processed: 1 });
playLogSchema.index({ driverId: 1, createdAt: 1 });
playLogSchema.index({ deviceId: 1, createdAt: 1 });
playLogSchema.index({ adId: 1 });

export interface IPlayLog extends Schema {
    deviceId: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    adId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    processed?: Boolean;
}

export default mongoose.model<IPlayLog>('PlayLog', playLogSchema);
