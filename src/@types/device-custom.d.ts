import { IDevice } from '../models/device.model';

declare module 'express' {
  interface Request {
    device?: IDevice;
  }
}