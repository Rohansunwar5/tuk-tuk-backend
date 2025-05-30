import pairingAttemptsModel, { ISessionStatus } from '../models/pairing-attempts.model';


export class PairingAttemptRepository {
    private _model = pairingAttemptsModel;

    async createSession( deviceId: string, driverId: string, sessionToken: string ) {
        return this._model.create({ deviceId, driverId, sessionToken, status: ISessionStatus.PENDING })
    }

    async findValidSession(deviceId: string, sessionToken: string) {
        return this._model.findOne({ deviceId, sessionToken, status: ISessionStatus.PENDING, expiresAt: {
            $gt: new Date()
        }}).exec();
    }

    async markSessionAs( sessionId: string, status: ISessionStatus ) {
        return this._model.findByIdAndUpdate(
            sessionId, 
            { $inc: { verificationAttempts: 1 }},
            { new: true }
        ).exec()
    }

    async incrementAttempts(sessionId: string) {
        return this._model.findByIdAndUpdate(
            sessionId,
            { $inc: { verificationAttempts: 1 }},
            { new: true }
        ).exec();
    }
}