import { io } from 'socket.io-client';

// Use the environment variable if defined, otherwise default to the deployed Clever Cloud backend
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://app-e079a1ab-622e-4a3f-9710-3cce046231f4.cleverapps.io';

const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export default socket;
