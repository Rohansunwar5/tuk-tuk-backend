import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import isLoggedIn from "../middlewares/isLoggedIn.middleware";
import { confirmPairing, initiatePairing } from "../controllers/pairing.controller";

const pairRouter = Router();

pairRouter.post('/initiate', isLoggedIn, asyncHandler(initiatePairing));
pairRouter.post('/confirm', isLoggedIn, asyncHandler(confirmPairing));


export default pairRouter;