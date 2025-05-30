import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    rpm: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true }
);

export interface IAd extends mongoose.Schema {
    title: string;
    videoUrl: string;
    duration: number;
    rpm: number;
    isActive: boolean;
}

export default mongoose.model<IAd>('Ad', adSchema);