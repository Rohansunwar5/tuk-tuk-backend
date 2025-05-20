import { NextFunction, Request, Response } from "express";
import playLogService from "../services/playlog.service";
import { BadRequestError } from "../errors/bad-request.error";

export const getDriverEarnings = async (req: Request, res: Response, next: NextFunction) => {
    const { driverId } = req.params;
    const { date } = req.query;

    const earnings = await playLogService.getDriverEarnings(driverId, date as string | null);

    next(earnings);
}


export const calculateDailyEarnings =  async (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.body;
  const calculationDate = date ? new Date(date) : new Date();
  calculationDate.setDate(calculationDate.getDate() - 1);

  const results = await playLogService.calculateDailyEarningsForAllDrivers(calculationDate);

  next(results);
}