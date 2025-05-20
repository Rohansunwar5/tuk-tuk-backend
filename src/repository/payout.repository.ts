import payoutModel from "../models/payout.model";

export class PayoutRepository {
    private _model = payoutModel;

    async create(payoutData: any) {
        return this._model.create(payoutData);
    }

    async getByPayoutId(payoutId: string) {
        return this._model.findOne({ payoutId });
    }

    async update(payoutId: string, updateData: any) {
        return this._model.findOneAndUpdate(
            { payoutId },
            updateData,
            { new: true }
        )
    }

    async getByDriverId(driverId: string) {
        return this._model.find({ driverId }).sort({ createdAt: -1 });
    }
}