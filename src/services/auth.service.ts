import config from '../config';
import { InternalServerError } from '../errors/internal-server.error';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { encode, encryptionKey, generateTOTPSecret, generateTOTPURI } from './crypto.service';
// import { encodedJWTCacheManager, profileCacheManager } from './cache/entities';
import { DriverRepository } from '../repository/driver.repository';
import otpService from './otp.service';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';

class AuthService {
  constructor(private readonly _driverRepository: DriverRepository) {}

  async initiateOTP(phoneNumber: string) {
    return otpService.sendOTP(phoneNumber);
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    await otpService.verifyOTP(phoneNumber, otp);
    const existingDriver = await this._driverRepository.findByPhone(phoneNumber);
    
    if (existingDriver?.profileCompleted) {
      return await this.generateTokens(existingDriver._id);
    }

    const tempToken = jwt.sign(
      { phoneNumber, temp: true },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { tempToken };
  }

  async completeRegistration(phoneNumber: string, firstName: string, lastName: string, vehicleNumber: string) {
    const driver = await this._driverRepository.createOrUpdate({ phoneNumber, firstName,lastName, vehicleNumber, profileCompleted: true });

    if (!driver) throw new InternalServerError('Failed to create driver profile')

    return await this.generateTokens(driver._id);
}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async hashPassword(plainTextPassword: string) {
    return await bcrypt.hash(plainTextPassword, 10);
  }

  private async generateTokens(driverId: string) {
    const accessToken = jwt.sign(
      { _id: driverId, type: 'access'},
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const refreshToken = jwt.sign(
      { _id: driverId, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn:'180d' }
    )

    await this._driverRepository.saveRefreshToken(driverId, refreshToken);

    return { accessToken, refreshToken };
  }

  async getProfile(driverId: string) {
    const driver = await this._driverRepository.findById(driverId);

    if(!driver) {
      throw new BadRequestError('driver not found');
    }

    return driver;
  }

  async updateProfile(params: { firstName?: string, lastName?: string ,_id: string, location?: string, vehicleNumber?: string}) {
    const { firstName, lastName, _id, location, vehicleNumber } = params;
    const driver = await this._driverRepository.updateDriver({ firstName, lastName, _id, location, vehicleNumber });

    if(!driver) throw new NotFoundError('Driver not found');

    return driver;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async findDriverById(driverId: string) {
      const driver = await this._driverRepository.findById(driverId);
      if (!driver) {
          throw new NotFoundError('Driver not found');
      }
      return driver;
  }
}

export default new AuthService(new DriverRepository());