import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import isLoggedIn from "../middlewares/isLoggedIn.middleware";
import { getDeviceStatus, refreshWsToken, regsiterDevice } from "../controllers/device.controllers";
import { isDeviceAuthenticated } from "../middlewares/isDeviceAuthenticated.middleware";

const deviceRouter = Router();

deviceRouter.post('/register', asyncHandler(regsiterDevice));
deviceRouter.get('/:deviceId/status', isLoggedIn, asyncHandler(getDeviceStatus));
deviceRouter.post('/:id/refresh-token' ,isDeviceAuthenticated, asyncHandler(refreshWsToken));

export default deviceRouter;