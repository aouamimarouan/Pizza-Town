import { io } from 'socket.io-client';

const getSocketUrl = () => {
  let backend = import.meta.env.VITE_BACKEND_URL;
  if (!backend) {
    const isBrowser = typeof window !== 'undefined';
    const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    backend = isLocalhost ? 'http://localhost:5000' : 'https://app-736fedd4-3a26-44ac-a5cc-6b340c821ab3.cleverapps.io';
  }
  return backend.replace(/\/$/, '');
};

const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true
});

export default socket;
