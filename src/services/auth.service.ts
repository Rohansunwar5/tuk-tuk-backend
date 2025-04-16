import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { UserRepository } from '../repository/user.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encode, encryptionKey, generateTOTPSecret, generateTOTPURI } from './crypto.service';
import { encodedJWTCacheManager, profileCacheManager } from './cache/entities';
import twoFactorAuthService from './2fa.service';
import { generateQRCodeSVG } from '../utils/qrUtils';

class AuthService {
  constructor(private readonly _userRepository: UserRepository) {
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async login(params: { email: string, password: string }) {
    const { email, password } = params;
    const user = await this._userRepository.getUserByEmailId(email);
    if (!user) throw new NotFoundError('User not found');
    if (!user.password) throw new BadRequestError('Reset password');

    // password validation;
    const success = await this.verifyHashPassword(password, user.password);
    if (!success) throw new UnauthorizedError('Invalid Email or Password');

    if(user.twoFactorEnabled) {
      if(!user.twoFactorSecret) throw new InternalServerError('2FA is enabled but no secret found');
      
      // short-lived token for 2FA verification
      const tempToken = jwt.sign(
        { 
          _id: user._id.toString(), 
          email: user.email, 
          requires2FA: true 
        },
        config.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return { requires2FA: true, tempToken }
    }

    // regular login without 2FA ;
    const accessToken = await this.generateJWTToken(user._id);
    if (!accessToken) throw new InternalServerError('Failed to generate accessToken');

    return { accessToken };
  }


  async verify2FA(userId: string, code: string) {
    const user = await this._userRepository.getUserById(userId);
    if(!user) throw new NotFoundError('User not found');
    if(!user.twoFactorEnabled || !user.twoFactorSecret) throw new BadRequestError('2FA not enabled for this user');

    const isValid = await twoFactorAuthService.verifyLoginCode( user.twoFactorSecret, code);

    if (!isValid) throw new UnauthorizedError('Invalid 2FA code');

    // Generate final access token
    const accessToken = await this.generateJWTToken(user._id);
    if (!accessToken) throw new InternalServerError('Failed to generate accessToken');

    return { accessToken };
  }

  async setup2FA(userId: string, email: string) {
    const user = await this._userRepository.getUserById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.twoFactorEnabled) throw new BadRequestError('2FA already enabled');

    // const setupData = await twoFactorAuthService.setup2FA(email);

    const secret = generateTOTPSecret();
    if (!/^[A-Z2-7]{16,32}$/.test(secret)) throw new Error('Invalid secret generated');

    const uri = generateTOTPURI(secret, email, 'rohan');
    // console.log('Generated TOTP URI:', uri); 

    const qrCode = generateQRCodeSVG(uri);
    
    // Store the unverified secret temporarily
    await this._userRepository.updateUser({
      _id: userId,
      twoFactorSecret: secret,
      twoFactorEnabled: false
    });

    return {
      qrCode,
      secret // For manual entry fallback
    };
  }

  async confirm2FA(userId: string, code: string, secret: string) {
    const user = await this._userRepository.getUserById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.twoFactorEnabled) throw new BadRequestError('2FA already enabled');
    if (user.twoFactorSecret.trim() !== secret.trim()) {
      throw new BadRequestError(`Invalid 2FA setup state`);
    }

    // console.log('Verifying code:', code, 'against secret:', user.twoFactorSecret);
    const isValid = await twoFactorAuthService.verifySetupCode(user.twoFactorSecret, code);
    if (!isValid) {
      console.log('Failed verification. Current server time:', new Date());
      throw new UnauthorizedError('Invalid verification code');
    }

    await this._userRepository.updateUser({
      _id: userId,
      twoFactorEnabled: true
    });
  
    return { success: true };
  }

  async disable2FA(userId: string) {
    await this._userRepository.updateUser({
      _id: userId,
      twoFactorEnabled: false,
      twoFactorSecret: '',
    });
    
    return { success: true };
  }

  async verifyHashPassword(plainTextPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async hashPassword(plainTextPassword: string) {
    return await bcrypt.hash(plainTextPassword, 10);
  }

  async generateJWTToken(userId: string) {
    const user = await this._userRepository.getUserById(userId);
    if (!user) throw new NotFoundError('User not found');

    const token = jwt.sign({
      _id: userId.toString(),
      email: user.email,
      twoFactorVerified: false
    }, config.JWT_SECRET, { expiresIn: '24h' });

    const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
    const encryptedData = await encode(token, key);
    await encodedJWTCacheManager.set({ userId }, encryptedData);

    return token;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async signup(params: any) {
    const { firstName, lastName, email, password } = params;
    const existingUser = await this._userRepository.getUserByEmailId(email);

    if (existingUser) throw new BadRequestError('Email address already exists');

    // get hashedPassword
    const hashedPassword = await this.hashPassword(password);

    const user = await this._userRepository.onBoardUser({
      firstName, lastName, email, password: hashedPassword
    });
    
    if (!user) throw new InternalServerError('Failed to Onboard user');

    // generate JWT Token
    const accessToken = await this.generateJWTToken(user._id);
    if (!accessToken) throw new InternalServerError('Failed to generate accessToken');

    return { accessToken };
  }

  async profile(userId: string) {
    const cached = await profileCacheManager.get({ userId });
    if (!cached) {
      const user = await this._userRepository.getUserById(userId);
      if (!user) throw new NotFoundError('User not found');

      // set cache;
      await profileCacheManager.set({ userId }, user);
      return user;
    }
    return cached;
  }

}

export default new AuthService(new UserRepository());