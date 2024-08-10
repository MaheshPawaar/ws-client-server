const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

let receivedOrders = [];
let actionQueue = [];

ws.on('open', () => {
  console.log('Connected to the WebSocket server.');
});

ws.on('message', (message) => {
  const order = JSON.parse(message);
  processOrder(order);
});

function processOrder(order) {
  if (isDuplicate(order)) return;

  receivedOrders.push(order);

  // Determine action
  const action = determineAction(order);
  if (action) logAction(action, order);

  // Aggregate and send updates to updater
  aggregateAndSend(order);
}

function isDuplicate(order) {
  return receivedOrders.some(
    (o) =>
      o.AppOrderID === order.AppOrderID &&
      o.price === order.price &&
      o.triggerPrice === order.triggerPrice &&
      o.priceType === order.priceType &&
      o.productType === order.productType &&
      o.status === order.status &&
      o.exchange === order.exchange &&
      o.symbol === order.symbol
  );
}

// Function to determine the action for the order
function determineAction(order) {
  const exists = (order) => {
    return receivedOrders.some((o) => o.AppOrderID === order.AppOrderID);
  };

  if (
    order.status === 'cancelled' &&
    (order.priceType === 'LMT' ||
      order.priceType === 'SL-LMT' ||
      order.priceType === 'SL-MKT')
  ) {
    return 'cancelOrder';
  }

  if (exists) {
    // Modify order if it exists
    if (
      (order.priceType === 'MKT' && order.status === 'complete') ||
      (order.priceType === 'LMT' && order.status === 'open') ||
      ((order.priceType === 'SL-LMT' || order.priceType === 'SL-MKT') &&
        order.status === 'pending')
    ) {
      return 'modifyOrder';
    }
  } else {
    // Place order if it does not exist
    if (
      (order.priceType === 'MKT' && order.status === 'complete') ||
      (order.priceType === 'LMT' && order.status === 'open') ||
      ((order.priceType === 'SL-LMT' || order.priceType === 'SL-MKT') &&
        order.status === 'pending')
    ) {
      return 'placeOrder';
    }
  }

  return 'unknown'; // Return 'unknown' if no action matches
}

function logAction(action, order) {
  console.log(
    `Action: ${action} for Order: ${
      order.AppOrderID
    } at ${new Date().toISOString()}`
  );
}

function aggregateAndSend(order) {
  // Implement aggregation logic within 1 second
  setTimeout(() => {
    actionQueue.push(order);
    if (actionQueue.length === 1) {
      sendToUpdater(actionQueue[0]);
    }
    actionQueue = [];
  }, 1000);
}

function sendToUpdater(order) {
  // Implement sending the update to an external service or function
  console.log(
    `Update sent to order book at ${new Date().toISOString()} for Order: ${JSON.stringify(
      order
    )}`
  );
}
