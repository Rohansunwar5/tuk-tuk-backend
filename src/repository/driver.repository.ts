import driverModel from '../models/driver.model'

export class DriverRepository {
    private _model = driverModel;

    async findById(id: string) {
        return this._model.findById(id).select('phoneNumber firstName lastName vehicleNumber balance refreshToken createdAt')
    }

    async createOrUpdate(params: { phoneNumber: string, firstName: string, lastName: string, vehicleNumber: string, profileCompleted: boolean }) {
        return this._model.findOneAndUpdate(
            { phoneNumber: params.phoneNumber },
            {
                $set: {
                    firstName: params.firstName,
                    lastName: params.lastName,
                    vehicleNumber: params.vehicleNumber,
                    profileCompleted: params.profileCompleted
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean().exec();
    }

    async findByPhone(phoneNumber: string) {
        const doc = await this._model.findOne({ phoneNumber }).select('+otpHash').exec();
        console.log('Retrieved Driver Document:', doc);
        return doc;
    }

    async saveOTP(phoneNumber: string, otpHash: string, otpExpiry: Date) {
        return this._model.findOneAndUpdate(
            { phoneNumber },
            {
                $set: { 
                    otpHash,
                    otpExpiry
                },
                $inc: { otpAttempts: 1 }
            },
            { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true
            }
        ).exec();  
    };

    async clearOTP(driverId: string) {
        return this._model.findByIdAndUpdate(
            { _id: driverId },
            {
                otpHash: null,
                otpExpiry: null,
                otpAttempts: 0,
            },
            { new : true }
        )
    }

    async saveRefreshToken(driverId: string, token: string) {
        return this._model.findByIdAndUpdate(
            { _id: driverId}, 
            { refreshToken: token },
            { new : true }
        )
    }

    async updateDriver(params: { _id: string, firstName?: string, lastName?: string, vehicleNumber?: string, location?: string }) {
        const { _id, firstName, lastName, vehicleNumber, location } = params;

        return this._model.findByIdAndUpdate(
            _id, 
            {
                firstName,
                lastName,
                vehicleNumber,
                location
            },
            { new: true }
        )
    }

    
    async updateRazorpayAccount(driverId: string, updateData: { razorpayFundAccountId?: string}) {
        return this._model.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true }
        ).exec();
    }


    async updateBalance(driverId: string, amount: number) {
        return this._model.findByIdAndUpdate(
            driverId,
            { 
                $inc: { balance: amount },
                $set: { lastPayoutAt: new Date() }
            },
            { new: true }
        ).exec();
    }
}