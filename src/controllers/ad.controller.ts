import { NextFunction, Request, Response } from 'express';
import uploadService from '../services/upload.service';
import { BadRequestError } from '../errors/bad-request.error';
import adService from '../services/ad.service';

export const createAd = async(req: Request, res: Response, next: NextFunction) => {
    if (!req.file) throw new BadRequestError('Video file is required');

    const uploadResult = await uploadService.uploadToS3( req.file, 'ad-videos', req.body.title.replace(/\s+/g, '-'))
    const ad = await adService.createAd( req.body.title, req.body.duration || 30, uploadResult.fileName, req.body.rpm || 100 )

    next(ad);
}

export const getActiveAds = async (req: Request, res: Response, next: NextFunction) => {
    const ads = await adService.getActiveAds();

    next(ads);
}