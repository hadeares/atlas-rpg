import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';
const realtimeBaseUrl = apiUrl.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/**
 * Socket único e compartilhado (namespace /realtime) reutilizado entre
 * navegações. A conexão só é aberta quando alguém realmente precisa dela
 * (ver connectRealtimeSocket), evitando handshake em páginas que não usam.
 */
export function getRealtimeSocket(): Socket {
  if (!socket) {
    socket = io(`${realtimeBaseUrl}/realtime`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (callback) => callback({ token: getAccessToken() })
    });
  }
  return socket;
}

export function connectRealtimeSocket(): Socket {
  const client = getRealtimeSocket();
  if (!client.connected) client.connect();
  return client;
}
