import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

console.log('Connecting to socket...');

socket.on('connect', () => {
  console.log('Connected to socket, waiting for new_order event...');
});

socket.on('new_order', (order) => {
  console.log('EVENT RECEIVED: new_order', order);
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout waiting for event.');
  process.exit(1);
}, 15000);
