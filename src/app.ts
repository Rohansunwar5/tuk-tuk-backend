import express, { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import cors from 'cors';
//@ts-ignore
import xss from 'xss-clean';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { getLocalIP } from './utils/system.util';
import logger, { getLogDataInJSONFromReqObject } from './utils/logger';
import { asyncHandler } from './utils/asynchandler';
import { notFound } from './controllers/health.controller';
import { globalHandler } from './middlewares/error-handler.middleware';
import rootRouter from './routes/v1.route';
import config from './config';
import { initWebSocketRoutes } from './routes/websocket.route';

const app = express();

// Add after app initialization
 // Initialize WebSocket
app.set('trust proxy', true); // very important for rate-limiter to trust the x-forwarded-for headers
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.use(express.json({ limit: '8mb' }));
app.use(cors());
app.use(xss());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));
app.use(mongoSanitize());

// @ts-ignore
app.use((req, res, next) => {
  try {
    const log = getLogDataInJSONFromReqObject(req);
    logger.info(`reqLog: ${JSON.stringify(log)}`);
    next();
  } catch (err) {
    logger.error('Request Logger Error - ', err);
    next();
  }
});

app.get('/test-aws', (req, res) => {
  res.json({
      region: config.AWS_REGION,
      accessKey: config.AWS_ACCESS_KEY_ID?.substring(0, 4) + '...',
      secretKey: config.AWS_SECRET_ACCESS_KEY?.substring(0, 4) + '...'
  });
});

app.use(rootRouter);

app.use('*', asyncHandler(notFound));

app.use((
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  data: any, req: Request, res: Response, next: NextFunction
) => {
  globalHandler(data, req, res, next);
});


logger.info(`Local IP - ${getLocalIP()}`);

export default app;