import { WebSocketServer } from 'ws';
import { handleDeviceConnection } from '../controllers/websocket.controller';
import { verifyDeviceToken } from '../middlewares/verifyDeviceToken.middleware';
import { BadRequestError } from '../errors/bad-request.error';

export const initWebSocketRoutes = (server: any) => {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    try {
      if (!req.url) {
        throw new BadRequestError('URL not available');
      }
      
      // Extract just the path and query from the URL
      const urlParts = req.url.split('?');
      console.log(urlParts);
      
      const queryString = urlParts.length > 1 ? `?${urlParts[1]}` : '';
      console.log('queryString: ',queryString );
      
      const wsStyleUrl = `ws://dummyhost${queryString}`;
      console.log('wsStyleUrl: ',wsStyleUrl);
      
      
      const deviceId = verifyDeviceToken(wsStyleUrl); 
      console.log('deviceId: ', deviceId);
      
      handleDeviceConnection(ws, req.url); 
    } catch (err) {
      const error = err as Error;
      ws.close(1008, error.message || 'Unauthorized');
    }
  });
};