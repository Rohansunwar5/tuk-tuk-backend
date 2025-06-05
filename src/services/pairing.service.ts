import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { ISessionStatus } from '../models/pairing-attempts.model';
import { PairingAttemptRepository } from '../repository/pairing-attempt.repository';
import deviceSerive from './device.service';
import crypto from 'crypto';

class PairingService {
    constructor( private readonly _pairingAttemptsRepository: PairingAttemptRepository ) {}

    async getSessionByToken(deviceId: string, sessionToken: string) {
        return this._pairingAttemptsRepository.findValidSession(deviceId, sessionToken);
    }


    async initiatePairing(deviceId: string, driverId: string) {
        const device = await deviceSerive.getDeviceForPairing(deviceId);

        if(!device) throw new NotFoundError('Driver not found');
        if(device.pairingLock) throw new UnauthorizedError('Device already paired');

        const sessionToken = crypto.randomBytes(16).toString('hex');

        const session = await this._pairingAttemptsRepository.createSession(deviceId, driverId, sessionToken);

        return session;
    }

    async verifyPairing(deviceId: string, sessionToken: string, driverId: string) {
        const session = await this._pairingAttemptsRepository.findValidSession(
            deviceId, 
            sessionToken
        );
        
        if (!session) throw new BadRequestError('Invalid or expired pairing session');
        if (session.driverId.toString() !== driverId) throw new BadRequestError('Session does not belong to this driver')

        const device = await deviceSerive.completePairing( deviceId, driverId );

        await this._pairingAttemptsRepository.markSessionAs( session._id.toString(),  ISessionStatus.COMPLETED );

        return { deviceId: device?._id.toString() };
    }

}

export default new PairingService(new PairingAttemptRepository());