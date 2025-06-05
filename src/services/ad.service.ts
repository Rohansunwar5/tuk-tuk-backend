import { InternalServerError } from '../errors/internal-server.error';
import { AdRepository } from '../repository/ad.repository';

class AdService {
    constructor(private readonly _adRepository: AdRepository) {}

    async createAd(title: string, duration: number, videoUrl: string, rpm: number = 100) {
        const ad = await this._adRepository.create({ title, duration, videoUrl, rpm, isActive: true });
        if(!ad) throw new InternalServerError('Failed to create ad');

        return ad;  
    }

    async getActiveAds() {
        return this._adRepository.findActiveAds();
    }
}

export default new AdService(new AdRepository());