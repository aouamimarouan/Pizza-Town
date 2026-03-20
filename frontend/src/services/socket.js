import { io } from 'socket.io-client';

// Use the same URL as your API, but without the /api suffix
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export default socket;
