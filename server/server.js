const WebSocket = require('ws');
const orders = require('./orders');

const server = new WebSocket.Server({ port: 8080 });

const delays = [1000, 2000, 3000, 5000]; // delays in milliseconds
const counts = [10, 20, 40, 30]; // counts for each delay

function sendUpdates(ws) {
  let index = 0;

  delays.forEach((delay, delayIndex) => {
    setTimeout(() => {
      for (let i = 0; i < counts[delayIndex]; i++) {
        if (index < orders.length) {
          const order = orders[index++];
          ws.send(JSON.stringify(order));
          console.log(
            `Update sent: ${JSON.stringify(
              order
            )} at ${new Date().toISOString()}`
          );
        }
      }
    }, delay);
  });
}

server.on('connection', (ws) => {
  console.log('Client connected');
  sendUpdates(ws);
});
