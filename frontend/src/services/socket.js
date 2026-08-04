import { io } from 'socket.io-client';

// Utilise l'URL du backend définie dans .env, avec localhost:5000 par défaut
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true
});

export default socket;
