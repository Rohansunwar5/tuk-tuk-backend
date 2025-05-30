import { IAd } from '../models/ad.model';
import adModel from '../models/ad.model';

export class AdRepository {
     private _model = adModel;

    async create(adData: Partial<IAd>) {
        return this._model.create(adData);
    }

    async findActiveAds(){
        return this._model.find({ isActive: true }).sort({ createdAt : -1 })
    }

    async findById(adId: string) {
        return this._model.findById(adId);
    }
}