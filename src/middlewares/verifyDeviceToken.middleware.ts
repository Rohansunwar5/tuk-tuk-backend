import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import jwt from 'jsonwebtoken';

export function verifyDeviceToken(url: string): string {
    // Extract just the query part
    const queryStart = url.indexOf('?');
    if (queryStart === -1) {
        throw new BadRequestError('Invalid URL format - missing query');
    }

    const query = url.slice(queryStart);
    const token = new URLSearchParams(query).get('token');
    
    if (!token) {
        throw new BadRequestError('Device token missing');
    }

    // Verification with debug logging
    console.log('Token verification secret:', config.DEVICE_JWT_SECRET);
    try {
        const payload = jwt.verify(token, config.DEVICE_JWT_SECRET!) as { deviceId: string };
        return payload.deviceId;
    } catch (err) {
        console.error('Token verification failed:', err);
        throw new BadRequestError('Invalid device token');
    }
}