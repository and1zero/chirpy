'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => {
    console.log('Client disconnected')
  });
  ws.on('message', (data) => {
    // data is already stringified
    console.log(data);
    // Broadcast to everyone else.
    wss.clients.forEach((client) => {
      if (ws !== client) {
        client.send(data);
      }
    });
  });
});

setInterval(() => {
  const message = {
    type: 'updateTime',
    date: Date.now()
  };
  wss.broadcast(JSON.stringify(message));
}, 1000);
