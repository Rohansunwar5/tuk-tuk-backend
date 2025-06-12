import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { getDeviceStatus, refreshWsToken, regsiterDevice } from '../controllers/device.controllers';
import { isDeviceAuthenticated } from '../middlewares/isDeviceAuthenticated.middleware';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';

const deviceRouter = Router();

deviceRouter.post('/register', asyncHandler(regsiterDevice));
deviceRouter.get('/:deviceId/status', isAdminLoggedIn, asyncHandler(getDeviceStatus));
deviceRouter.post('/:id/refresh-token' ,isDeviceAuthenticated, asyncHandler(refreshWsToken));

export default deviceRouter;