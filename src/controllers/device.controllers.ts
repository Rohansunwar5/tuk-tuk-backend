import { Request, Response, NextFunction } from "express";

import deviceService from "../services/device.service";
import { UnauthorizedError } from "../errors/unauthorized.error";


export const regsiterDevice = async (req: Request, res: Response, next: NextFunction) => {
    const { hardwareId, model } = req.body;
    const device = await deviceService.registerDevice(hardwareId, model);

    next(device);
}

export const getDeviceStatus = async (req: Request, res:Response, next: NextFunction) => {
    const { deviceId } = req.params;
    const device = await deviceService.getDeviceForPairing(deviceId);

    next(device);
}

export const refreshWsToken = async (req: Request, res:Response, next: NextFunction) => {
    
    // const { _id } = req.device;
    if(!req.device) throw new UnauthorizedError('Device authentication middleware not called');

    const newToken = await deviceService.refreshWsToken(req.device._id.toString());
    console.log("new Token: ",newToken);
    
    
    next(newToken);
};