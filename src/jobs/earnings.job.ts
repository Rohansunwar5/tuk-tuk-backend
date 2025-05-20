// earnings.job.ts
import cron from 'node-cron';
import playLogService from '../services/playlog.service';
import logger from '../utils/logger';

cron.schedule('50 23 * * *', async () => {
  try {
    const calculationDate = new Date();
    calculationDate.setDate(calculationDate.getDate() - 1); // Yesterday
    
    const results = await playLogService.calculateDailyEarningsForAllDrivers(calculationDate);
    
    logger.info(`Daily earnings calculated`, {
      date: calculationDate,
      totalDrivers: results.length,
      totalPayout: results.reduce((sum, r) => sum + r.totalEarnings, 0)
    });
    
  } catch (error) {
    logger.error('Earnings calculation failed', { error });
  }
});