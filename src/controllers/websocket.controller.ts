import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config';
import deviceService from '../services/device.service';
import pairingService from '../services/pairing.service';
import { NotFoundError } from '../errors/not-found.error';
import { BadRequestError } from '../errors/bad-request.error';

export async function handleDeviceConnection(ws: WebSocket, requestUrl: string) {
  let deviceId: string;
  let heartbeatInterval: NodeJS.Timeout;

  const cleanup = async () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (deviceId) {
      await deviceService.markDisconnected(deviceId).catch(err => {
        console.error('Disconnect update failed:', err);
      });
    }
  };

  const setupHeartbeat = () => {
    heartbeatInterval = setInterval(async () => {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
          await deviceService.updateLastSeen(deviceId);
        }
      } catch (err) {
        console.error('Heartbeat failed:', err);
        ws.close(1001, 'Heartbeat error');
      }
    }, 30000);
  };

  try {
    // 1. Extract token from URL
    
    const queryStart = requestUrl.indexOf('?');
    if (queryStart === -1) throw new BadRequestError('Missing query parameters');
    
    const query = requestUrl.slice(queryStart);
    console.log("query: ",query);
    
    const token = new URLSearchParams(query).get('token');
    console.log("token: ", token);
    
    
    if (!token) throw new BadRequestError('Missing token');

    // 2. Verify token
    const decoded = jwt.verify(token, config.DEVICE_JWT_SECRET!) as { deviceId: string };
    deviceId = decoded.deviceId;

    console.log("decoded: ", decoded);
    console.log("deviceId: ", deviceId);
    

    // 3. Verify device
    const device = await deviceService.getDeviceForRefresh(deviceId);
    
    if (!device) throw new NotFoundError('Device not found');

    // 4. Update connection status
    await deviceService.updateConnectionStatus(deviceId, true);
    setupHeartbeat();

    // Message handlers
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'PAIRING_CONFIRMATION') {
          if (device.pairingLock) throw new BadRequestError('Device already paired');

          const session = await pairingService.getSessionByToken(deviceId, data.sessionToken);
          if (!session) throw new NotFoundError('Pairing session not found');
          
          const result = await pairingService.verifyPairing(
            deviceId,
            data.sessionToken,
            session.driverId.toString()
          );

          ws.send(JSON.stringify({
            type: 'PAIRING_SUCCESS',
            deviceId: result.deviceId
          }));
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: "ERROR", message: err.message }));
      }
    });

    ws.on('pong', () => {
      deviceService.updateLastSeen(deviceId).catch(console.error);
    });

    ws.on('close', cleanup);
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      cleanup();
    });

  } catch (err: any) {
    console.error('Connection failed:', err.message);
    ws.close(1001, err.message);
    cleanup();
  }
}