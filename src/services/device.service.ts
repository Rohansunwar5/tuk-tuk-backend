import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { IDevice, IStatus } from '../models/device.model';
import { DeviceRepository } from '../repository/device.repository';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class DeviceService {
    constructor(private readonly _deviceRepository: DeviceRepository) {}

    async registerDevice(hardwareId: string, model: string) {
        const existingDevice = await this._deviceRepository.findByHardwareId(hardwareId);

        if(existingDevice) throw new BadRequestError('Device already registered');

        const deviceId = `TUKTUK-${Date.now()}`;
        const initialPairingToken = crypto.randomBytes(32).toString('hex');

        const device = await this._deviceRepository.create({ hardwareId, deviceId, model, initialPairingToken, status: 'unpaired' });

        // In device.service.ts - Token generation
         console.log('Token generation secret:', config.DEVICE_JWT_SECRET);
        const wsToken = jwt.sign(
        { 
            deviceId: device._id.toString(), // Ensure string conversion
            iat: Math.floor(Date.now() / 1000) // Add issued at timestamp
        },
        config.DEVICE_JWT_SECRET!,
        { expiresIn: '24h' }
        );

        return { device, wsToken };
    }

    async getDeviceForPairing(deviceId: string) {
        const device = await this._deviceRepository.findById(deviceId);
        if(!device) throw new NotFoundError('Device not found');
        if(device.pairingLock) throw new UnauthorizedError('Device already paired');

        return device;
    }

    async completePairing(deviceId: string, driverId: string) {
        const paired = await this._deviceRepository.updatePairingStatus(deviceId, IStatus.PAIRED, driverId);

        return paired
    }

    async updateLastSeen(deviceId: string): Promise<void> {
        await this._deviceRepository.updateLastSeen(deviceId);
    }

    async markDisconnected(deviceId: string): Promise<void> {
        await this._deviceRepository.markDisconnected(deviceId);
    }

    async getDeviceForRefresh(deviceId: string) {
        console.log('inside getDeviceforRefresh');
        
        return this._deviceRepository.getDeviceForRefresh(deviceId);
    } 

    async refreshWsToken(deviceId: string) {
        await this.getDeviceForRefresh(deviceId);

        return jwt.sign(
            { deviceId },
            config.DEVICE_JWT_SECRET!,
            { expiresIn: '30d' }
        )
    }

    async updateConnectionStatus(deviceId: string, connected: boolean): Promise<IDevice | null> {
        return this._deviceRepository.updateConnectionStatus(deviceId, connected);
    }

    // async getConnectionStatus(deviceId: string): Promise<boolean> {
    //     const device = await this._deviceRepository.findById(deviceId);
    //     return device?.wsConnection?.connected || false;
    // }
}

export default new DeviceService(new DeviceRepository());