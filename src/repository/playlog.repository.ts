import mongoose from "mongoose";
import playlogModel, { IPlayLog } from "../models/playlog.model";

export class PlayLogRepository {
    private _model = playlogModel;

    async create(playLogData: Partial<IPlayLog>) {
        return this._model.create(playLogData);
    }

    async updatePlayLog(logId: string, updateData: Partial<IPlayLog>) {
        return this._model.findByIdAndUpdate(logId, updateData, { new: true });
    }

    async getDailyLogsForDriver(driverId: string, date: Date) {
        const start = new Date(date.setHours(0,0,0,0));
        const end = new Date(date.setHours(23, 59,59, 999));

        return this._model.aggregate([
            {
                $match: {
                    driverId: new mongoose.Types.ObjectId(driverId),
                    endTime: { $exists: true },
                    createdAt: { $gte: start, $lt: end }
                }
            },
            {
                $lookup: {
                    from:'ads',
                    localField: 'adId',
                    foreignField: '_id',
                    as: 'ad',
                }
            },
            { $unwind: '$ad' }
        ])
    }

    async getDailyEarningsForAllDrivers(date: Date) {
    const start = new Date(date.setHours(0,0,0,0));
    const end = new Date(date.setHours(23,59,59,999));
    
    return this._model.aggregate([
        {
        $match: {
            endTime: { $exists: true },
            createdAt: { $gte: start, $lt: end }
        }
        },
        {
        $lookup: {
            from: 'ads',
            localField: 'adId',
            foreignField: '_id',
            as: 'ad'
        }
        },
        { $unwind: '$ad' },
        {
        $group: {
            _id: '$driverId',
            totalEarnings: {
            $sum: {
                $divide: [
                { $multiply: ['$duration', '$ad.rpm'] },
                30000 // 30*1000
                ]
            }
            }
        }
        }
    ]);
    }
    
    async findById(logId: string) {
        return this._model.findById(logId);
    }

    // In playlog.repository.ts
    async markAsProcessed(logId: string) {
        return this._model.findOneAndUpdate(
            { 
                _id: logId,
                processed: { $ne: true } // Only update if not already processed
            },
            { 
                $set: { 
                    processed: true,
                    endTime: new Date() 
                } 
            },
            { new: true }
        );
    }

    async getDevicePlayHistory(deviceId: string, days: number = 7) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        
        return this._model.aggregate([
            {
            $match: {
                deviceId: new mongoose.Types.ObjectId(deviceId),
                createdAt: { $gte: date }
            }
            },
            {
            $group: {
                _id: '$adId',
                totalDuration: { $sum: '$duration' },
                playCount: { $sum: 1 }
            }
            }
        ]);
    }

    async isSessionActive(logId: string) {
        return this._model.exists({
            _id: logId,
            endTime: { $exists: false }
        });
    }
}