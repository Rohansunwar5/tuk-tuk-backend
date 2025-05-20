import { Router } from 'express';
import { health, helloWorld } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asynchandler';
import authRouter from './auth.route';
import deviceRouter from './device.routes';
import pairRouter from './pairing.route';
import adRouter from './ad.routes';
import playLogRouter from './playlog.route';
import earningsRoute from './earnings.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));
v1Router.use('/auth', authRouter);
v1Router.use('/ad', adRouter);
v1Router.use('/playlog', playLogRouter);
v1Router.use('/earnings', earningsRoute);
v1Router.use('/device', deviceRouter);
v1Router.use('/pairings', pairRouter);

export default v1Router;
