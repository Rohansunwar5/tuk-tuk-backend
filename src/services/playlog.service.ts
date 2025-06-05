import { Types } from "mongoose";
import { BadRequestError } from "../errors/bad-request.error";
import { DeviceRepository } from "../repository/device.repository";
import { DriverRepository } from "../repository/driver.repository";
import { PlayLogRepository } from "../repository/playlog.repository";
import { IPlayLog } from "../models/playlog.model";
import { AdRepository } from "../repository/ad.repository";
import authService from "./auth.service";

class PlayLogService {
    constructor(
        private readonly _playLogRepository: PlayLogRepository,
        private readonly _deviceRepository: DeviceRepository,
        private readonly _driverRepository: DriverRepository,
        private readonly _adRepository: AdRepository,
    ) {}

    async startPlaySession(deviceId: string, adId: string) {
        const device = await this._deviceRepository.findById(deviceId);
        if(!device || !device.driverId) throw new BadRequestError('Device not paired with driver');
        
        const playLogData: Partial<IPlayLog> = {
            deviceId: new Types.ObjectId(deviceId),
            driverId: new Types.ObjectId(device.driverId),
            adId: new Types.ObjectId(adId),
            startTime: new Date()
        };
        
        return this._playLogRepository.create(playLogData);
    }

    async getDriverEarnings(driverId: string, dateStr: string | null) {
        if (!dateStr) {
            const driver = await authService.findDriverById(driverId)
            return driver.balance;
        }
        
        const calculationDate = new Date(dateStr);
        if (isNaN(calculationDate.getTime())) throw new BadRequestError('Invalid date format')
        const earnings = await this.calculateDriverEarnings(driverId, calculationDate);
        
        return earnings;
    }

    async endPlaySession(logId: string) {
        const existingLog = await this._playLogRepository.markAsProcessed(logId);
        if(!existingLog) throw new BadRequestError('This play session was already processed');

        const endTime = new Date();
        const log = await this._playLogRepository.updatePlayLog(logId, {endTime, processed: true });

        if (log) {
            const reportedDuration = (endTime.getTime() - log.startTime.getTime()) / 1000;
            
            // Get ad details for validation
            const ad = await this._adRepository.findById(log.adId.toString());
            if (!ad) throw new BadRequestError('Ad not found');

            // ENHANCED: Validate and cap duration
            const validatedDuration = this.validateAndCapDuration(reportedDuration, ad, logId);
            
            // Update with validated duration
            const updatedLog = await this._playLogRepository.updatePlayLog(logId, { 
                duration: validatedDuration 
            });
            
            // Calculate earnings based on VALIDATED duration
            const earnings = (validatedDuration / 30) * (ad.rpm / 1000);
            await this._driverRepository.updateBalance(
                log.driverId.toString(), 
                Number(earnings.toFixed(2))
            );
            
            return updatedLog;
        }

        return null;
    }

    //NEW: Duration validation and capping logic
    private validateAndCapDuration(reportedDuration: number, ad: any, logId: string): number {
        const maxAllowedDuration = ad.duration * 1.2; // 20% buffer for loading / buffering
        const minPlayTime = 3; // must play atleast 3 sec

        //log suspicious activity for monitoring
        if( reportedDuration > maxAllowedDuration ) {
            console.warn(`[FRAUD ALERT] Duration exceeded for logId: ${logId}`, {
                reported: reportedDuration,
                adDuration: ad.duration,
                maxAllowed: maxAllowedDuration,
                adTitle: ad.title,
                timestamp: new Date()
            });
        }

        if (reportedDuration < minPlayTime) {
            console.warn(`[FRAUD ALERT] Play duration too short for logId: ${logId}`, {
                reported: reportedDuration,
                minRequired: minPlayTime,
                adTitle: ad.title,
                timestamp: new Date()
            });
        }

        // Cap at actual ad duration (no earnings for "over-play")
        const validDuration = Math.min(reportedDuration, ad.duration);
        
        // Apply minimum play time requirement
        return Math.max(validDuration, minPlayTime);
    }
   
    async calculateDriverEarnings(driverId: string, date: Date) {
    // Now just returns historical data without updating balance
    const logs = await this._playLogRepository.getDailyLogsForDriver(driverId, date);
    
        return logs.reduce((sum: number, log: { duration: number, ad: { rpm: number }}) => {
            return sum + (log.duration / 30) * (log.ad.rpm / 1000);
        }, 0);
    }

    async verifyPlaySession(logId: string) {
        const log = await this._playLogRepository.findById(logId);
        
        // Session is active if there's no endTime
        if (!log || log.endTime) return false;
        
        // Verify device is still online and paired
        const device = await this._deviceRepository.findById(log.deviceId.toString());
        if (device?.status !== 'paired') return false;
        
        // Optional: Add GPS/location verification here later
        return true;
    }

    async calculateDailyEarningsForAllDrivers(date: Date) {
        return this._playLogRepository.getDailyEarningsForAllDrivers(date);
    }

    async verifyCompletedSession(logId: string) {
        const log = await this._playLogRepository.findById(logId);
        if (!log || !log.endTime || !log.duration) throw new BadRequestError("Invalid or incomplete play session")

        const fraudReasons: string[] = [];

        //1. Duration validation
        // const ad = await this.adRepository.findById(log.adId.toString());
        // if(ad) {
        //     const maxAllowedDuration = ad.duration * 1.5;
        //     if(log.duration > maxAllowedDuration) {
        //         fraudReasons.push(`Duration exceeded (${log.duration}s > ${maxAllowedDuration}s)`);
        //     }
        // }

        const device = await this._deviceRepository.findById(log.deviceId.toString());
        if (device?.status !== 'paired') {
            fraudReasons.push("Device unpaired or offline");
        }

        // 3. Location Consistency (Future)
        // if (log.location !== device.lastKnownLocation) {
        //     fraudReasons.push("Location mismatch");
        // }

        return {
        isValid: fraudReasons.length === 0,
        ...(fraudReasons.length > 0 && { fraudReasons })
        };

    }

}

export default new PlayLogService(
  new PlayLogRepository(),
  new DeviceRepository(),
  new DriverRepository(),
  new AdRepository()
);