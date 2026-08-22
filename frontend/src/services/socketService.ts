import { io, Socket } from 'socket.io-client';
import { useNotificationsStore } from '../stores/notificationsStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');
    this.socket = io(wsUrl, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('notification', (data) => {
      console.log('Received notification:', data);
      const store = useNotificationsStore();
      store.addNotification(data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
