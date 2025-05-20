import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { endPlaySession, startPlaySession, verifyCompletedSession, verifyPlaySession } from "../controllers/playlog.controller";


const playLogRouter = Router();

playLogRouter.post('/start', asyncHandler(startPlaySession));
playLogRouter.put('/end/:logId', asyncHandler(endPlaySession));
playLogRouter.get('/verify/:logId', asyncHandler(verifyPlaySession));
playLogRouter.post('/verify-completed/:logId', asyncHandler(verifyCompletedSession));

export default playLogRouter;