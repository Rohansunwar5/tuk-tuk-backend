import { Router } from 'express';
import { uploadAnyFile } from '../utils/multer.util';
import { asyncHandler } from '../utils/asynchandler';
import { createAd, getActiveAds } from '../controllers/ad.controller';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';

const adRouter = Router();

adRouter.post('/', isAdminLoggedIn, uploadAnyFile.single('video'), asyncHandler(createAd));
adRouter.get('/', isAdminLoggedIn, asyncHandler(getActiveAds));

export default adRouter;