import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import AWS from 'aws-sdk';
import bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { DriverRepository } from '../repository/driver.repository';
import config from '../config'

const numericNanoid = customAlphabet('0123456789', 6);

class OTPService {
    private readonly _sns: AWS.SNS;
    private readonly _driverRepo: DriverRepository;

    constructor(
        
        snsInstance: AWS.SNS = new AWS.SNS({ 
            region: config.AWS_REGION,
            accessKeyId: config.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            apiVersion: '2010-03-31' 
        }),
        driverRepo: DriverRepository = new DriverRepository()
    ) {
        if (!snsInstance.config.region) {
            throw new Error('AWS region must be configured');
        }
        // console.log('Final AWS Config:', {
        //     region: config.AWS_REGION,
        //     accessKey: config.AWS_ACCESS_KEY_ID?.substring(0, 4),
        //     secretKey: config.AWS_SECRET_ACCESS_KEY?.substring(0, 4)
        //   });
        this._sns = snsInstance; 
        
        // Just use this one
        this._driverRepo = driverRepo;
    }

    async sendOTP(phoneNumber: string): Promise<{ otpExpiry: Date }> {
        const otp = numericNanoid();
        const otpHash = await bcrypt.hash(otp, 10);
        console.log(`Storing OTP - Plain: ${otp} | Hash: ${otpHash}`);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        try {
            //saved hashed otp to database 
            await this._driverRepo.saveOTP(
                phoneNumber,
                otpHash,
                otpExpiry,
            );

            // send via aws sns 
            console.log("otp sent to the number: ", otp);
            
            await this._sendSMS(phoneNumber, otp);

            return { otpExpiry };
        } catch (error) {
            throw new InternalServerError('Failed to send OTP');
        }
    } 

    private async _sendSMS(phoneNumber: string, otp: string): Promise<void> {
        const params: AWS.SNS.PublishInput = {
            Message: `Your TukTuk verification code: ${otp}\n Valid for 5 minutes`,
            PhoneNumber: phoneNumber,
            MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional'
                }
            }
        };

        try {
            // console.log('Attempting to send SMS with params:', params);
            const result = await this._sns.publish(params).promise();
            // console.log('SMS sent successfully:', result);
        } catch (error) {
            console.error('SMS sending failed:', error);
            throw error; // This will be caught by the outer try-catch
        }
    }

    async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
        const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        const driver = await this._driverRepo.findByPhone(normalizedPhone);
        // console.log("driver: " ,driver);
        // console.log("dricer otp hash: ", driver?.otpHash);
        
        

        if(!driver || !driver.otpHash) {
            throw new BadRequestError('OTP verification failed');
        }

        // console.log(`Current time: ${new Date()} | OTP Expiry: ${driver.otpExpiry}`);
        if (!driver.otpExpiry || driver.otpExpiry < new Date()) {
        throw new BadRequestError('OTP expired');
        }

         // Verify OTP
         const isValid = await bcrypt.compare(otp, driver.otpHash);
        //  console.log(`OTP Comparison - Input: ${otp} | Stored Hash: ${driver.otpHash} | Valid: ${isValid}`);
         if (!isValid) {
           throw new BadRequestError('Invalid OTP');
         }

        // Clear OTP after successful verification
        await this._driverRepo.clearOTP(driver._id);
        return true;
    }
}

export default new OTPService();
