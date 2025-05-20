import { Request, Response, NextFunction } from "express";
import playlogService from "../services/playlog.service";


export const startPlaySession = async (req: Request, res: Response, next: NextFunction) => {
    const { deviceId, adId } = req.body;
    const playLog = await playlogService.startPlaySession(deviceId, adId);

    next(playLog);
}

export const endPlaySession = async (req: Request, res: Response, next: NextFunction) => {
    const { logId } = req.params;
    const playLog = await playlogService.endPlaySession(logId);

    next(playLog);
}

export const verifyPlaySession = async (req: Request, res: Response, next: NextFunction) => {
    const { logId } = req.params;
    const isValid = await playlogService.verifyPlaySession(logId);

    next(isValid);
}

export const verifyCompletedSession = async (req: Request, res: Response, next: NextFunction) => {
    const { logId } = req.params;
    const { isValid, fraudReasons } = await playlogService.verifyCompletedSession(logId);

     return res.status(200).json({ 
        valid: isValid,
        ...(!isValid && { fraudReasons }) 
    });
}