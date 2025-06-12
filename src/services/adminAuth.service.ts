import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { customAlphabet } from "nanoid";
import { AdminRepository } from "../repository/admin.repository";
import { NotFoundError } from "../errors/not-found.error";
import { BadRequestError } from "../errors/bad-request.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { InternalServerError } from "../errors/internal-server.error";
import { encode, encryptionKey } from './crypto.service';
import { encodedJWTCacheManager } from './cache/entities';
import config from '../config';
import { sha1 } from '../utils/hash.util';

const nanoid = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  16
);

class AdminAuthService {
    constructor(private readonly _adminRepository: AdminRepository) {} 

    async login(params: { email: string; password: string}) {
        const { email, password } = params;
        const admin = await this._adminRepository.getUserByEmailId(email);
        if(!admin) throw new NotFoundError('Admin not found');
        if(!admin.password) throw new BadRequestError('Reset password');
        
        const success = await this.verifyHashPassword(password, admin.password);
        if(!success) throw new UnauthorizedError('Invalid email or password');

        const accessToken = await this.generateJWTToken(admin._id);
        if(!accessToken) throw new InternalServerError('Failed to generate accessToken')

        return { accessToken };
    }

    async verifyHashPassword(plainTextPassword: string, hashedPassword: string) {
        return await bcrypt.compare(plainTextPassword, hashedPassword);
    }

    async hashPassword(plainTextPassword: string) {
        return await bcrypt.hash(plainTextPassword, 10);
    }

    async generateJWTToken(userId: string) {
        const token = jwt.sign(
        {
            _id: userId.toString(),
        },
        config.ADMIN_JWT_SECRET,
        { expiresIn: '24h' }
        );

        const key = await encryptionKey(config.ADMIN_JWT_CACHE_ENCRYPTION_KEY);
        const encryptedData = await encode(token, key);
        await encodedJWTCacheManager.set({ userId }, encryptedData);

        return token;
    }

    async signup(params: any) {
        const { firstName, lastName, phoneNumber, email, password } =
        params;
        const existingUser = await this._adminRepository.getUserByEmailId(email);

        if (existingUser) throw new BadRequestError('Email address already exists');

        // get hashedPassword
        const hashedPassword = await this.hashPassword(password);
        const verificationCode = nanoid();
        // send this verificationCode via email to verify.
        const user = await this._adminRepository.onBoardAdmin({
        firstName,
        lastName,
        phoneNumber,
        email,
        password: hashedPassword,
        verificationCode: sha1(verificationCode),
        });
        if (!user) throw new InternalServerError('Failed to Onboard user');

        // mailService.sendEmail(
        //   email,
        //   'verification.ejs',
        //   { verificationCode },
        //   'Verify Your Email Address to Get Started! - WorkPlay Studio Pvt Ltd.'
        // );

        // generate JWT Token
        const accessToken = await this.generateJWTToken(user._id);
        if (!accessToken)
        throw new InternalServerError('Failed to generate accessToken');

        return { accessToken };
    }

    async profile(userId: string) {
        const user = await this._adminRepository.getUserId(userId);

        return user;
    }

    async resetPassword(code: string, password: string) {
        const admin = await this._adminRepository.getUserWithVerificationCode(code);

        if (!admin) throw new BadRequestError('Invalid code');

        const hashedPassword = await this.hashPassword(password);
        const passwordUpdated = await this._adminRepository.resetPassword(
        code,
        hashedPassword
        );

        if (!passwordUpdated)
        throw new InternalServerError('Failed to reset password');

        const newVerificationCode = nanoid();
        await this._adminRepository.updateVerificationCode(
        admin.id,
        sha1(newVerificationCode)
        );

    // mailService.sendEmail(
    //   admin.email,
    //   'admin-reset-password-success.ejs',
    //   {
    //     firstName: admin.firstName,
    //   },
    //   'Password Reset Successfull: Login Now! Workplay Studio Pvt Ltd.'
    // );

        return true;
    }

    async updateProfile(params: { _id: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string}) {
        const { _id, firstName, lastName, email, phoneNumber } = params;

        const updatedAdmin = await this._adminRepository.updateAdmin({ _id, firstName, lastName, email, phoneNumber });

        if(!updatedAdmin) throw new NotFoundError('Admin not found');

        return updatedAdmin;
    }

    async generateResetPasswordLink(email: string) {
        const adminExists = await this._adminRepository.getUserByEmailId(email);
        if(!adminExists) throw new NotFoundError('Admin not found');

        const verificationCode = nanoid();
        const admin = await this._adminRepository.updatedVerificationCode(
            adminExists._id,
            sha1(verificationCode)
        )

        if(!admin) throw new InternalServerError('Failed to generate verification code');

        // mailService.sendEmail(
        //     admin.email,
        //     'admin-reset-password.ejs',
        //     {
        //         verificationCode,
        //         firstName: admin.firstName,
        //     },
        //     'Reset your Password: Regain Acesss to your Account! - Workplay Studio Pvt Ltd'
        // );

        return true;
    }

    async verifyResetPasswordCode(code: string) {
        const admin = await this._adminRepository.getUserWithVerificationCode(code);
        if(!admin) throw new BadRequestError('Invlaid code');

        return true;
    }

    // async deleteAccount(adminId: string, initialAdmin: string) {
    //     if(adminId === initialAdmin) throw new ForbiddenError()
    // }

}

export default new AdminAuthService(new AdminRepository());