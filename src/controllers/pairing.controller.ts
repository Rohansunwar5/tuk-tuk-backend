import { NextFunction, Request, Response } from 'express';
import pairingService from '../services/pairing.service';

export const initiatePairing = async (req:Request, res: Response, next: NextFunction) => {
    const { deviceId } = req.body;
    const { _id } = req.driver;

    const session = await pairingService.initiatePairing(deviceId, _id);

    next(session);
}

export const confirmPairing = async (req:Request, res: Response, next: NextFunction) => {
    const { deviceId, sessionToken } = req.body;
    const { _id } = req.driver;

    const device = await pairingService.verifyPairing(deviceId, sessionToken, _id);

    next(device);
}
