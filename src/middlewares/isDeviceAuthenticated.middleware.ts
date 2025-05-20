// isDeviceAuthenticated.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { UnauthorizedError } from "../errors/unauthorized.error";
import deviceService from "../services/device.service";

export const isDeviceAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) throw new UnauthorizedError("Missing auth token");

  try {
    // Special handling for refresh token endpoint
    const isRefreshEndpoint = req.originalUrl.includes('refresh-token');
    
    let decoded;
    try {
      decoded = jwt.verify(token, config.DEVICE_JWT_SECRET!) as { deviceId: string };
    } catch (err:any) {
      // Only allow expired tokens for refresh endpoint
      if (isRefreshEndpoint && err.name === 'TokenExpiredError') {
        decoded = jwt.decode(token) as { deviceId: string };
      } else {
        throw err;
      }
    }

    const device = await deviceService.getDeviceForRefresh(decoded.deviceId);
    
    if (!device.wsConnection?.connected) {
      await deviceService.updateConnectionStatus(decoded.deviceId, true);
    }

    req.device = device;
    next();
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
};