import mongoose from 'mongoose';
import deviceModel ,{ IDevice, IStatus } from '../models/device.model';
import { NotFoundError } from '../errors/not-found.error';


export class DeviceRepository {
    private _model = deviceModel

    async create(deviceData: Partial<IDevice>): Promise<IDevice>{
        return this._model.create(deviceData);
    }

    async findByHardwareId(hardwareId: string) {
        return this._model.findOne({ hardwareId }).exec();
    }

    async findById(deviceId: string) {
        return this._model.findById(deviceId).exec();
    }

    async updatePairingStatus ( deviceId: string, status: IStatus, driverId?: string ) {
        const update : any = { status };
        if(driverId) {
            update.driverId = new mongoose.Types.ObjectId(driverId);
            update.pairingLock =true;
        }

        return this._model.findByIdAndUpdate(
            deviceId, update, { new: true }
        ).exec();

    }

    async removeDriverAssociation(deviceId: string) {
        return this._model.findByIdAndUpdate(
            deviceId,
            {
                $unset: { driverId: 1 },
                pairingLock: false,
                status: IStatus.UNPAIRED
            },
            { new : true }
        ).exec();
    }

    async updateLastSeen(deviceId: string): Promise<IDevice | null> {
        return this._model.findByIdAndUpdate(
            deviceId,
            { 
                $set: { 
                    lastSeenAt: new Date(),
                    'wsConnection.lastPingAt': new Date(),
                    'wsConnection.connected': true 
                } 
            },
            { new: true }
        ).exec();
    }

    async markDisconnected(deviceId: string): Promise<IDevice | null> {
        return this._model.findByIdAndUpdate(
            deviceId,
            { $set: { 'wsConnection.connected': false } },
            { new: true }
        ).exec();
    }

    async updateConnectionStatus(
        deviceId: string, 
        connected: boolean
    ): Promise<IDevice | null> {
        return this._model.findByIdAndUpdate(
            deviceId,
            { 
                $set: { 
                    'wsConnection.connected': connected,
                    ...(connected ? { 
                        'wsConnection.lastPingAt': new Date(),
                        lastSeenAt: new Date() 
                    } : {})
                } 
            },
            { new: true }
        ).exec();
    }

    async getDeviceForRefresh(deviceId: string) {
        const device = await this._model.findById(deviceId);

        console.log('device: ', device);
        

        if(!device) throw new NotFoundError('Device not found or not paired');

        return device;
    }

}