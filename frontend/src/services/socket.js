import { io } from 'socket.io-client';

// Hardcoded to Clever Cloud to ensure Vercel doesn't use an incorrect environment variable
const SOCKET_URL = 'https://app-e079a1ab-622e-4a3f-9710-3cce046231f4.cleverapps.io';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true
});

export default socket;
