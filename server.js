'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use(express.static('public'))
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

// Remember the clients
let clients = {};
// cache chat histories
const MAX_CHAT_ITEMS = 20; // max chat messages to remember
let chats = [];

io.on('connection', (socket) => {
  // save connected client
  clients[socket.id] = socket;
  socket.broadcast.emit('user connected', socket.id);
  socket.emit('load chat histories', chats);

  socket.on('disconnect', () => {
    delete clients[socket.id];
    socket.broadcast.emit('user disconnected', socket.id);
  });

  socket.on('chat message', (message) => {
    // Sending data to everyone except the sender
    chats.push(message);
    if (chats.length > MAX_CHAT_ITEMS) {
      chats.splice(0, 1);
    }
    socket.broadcast.emit('chat message', message);
  });

  socket.on('typing', (message) => socket.broadcast.emit('typing', message));
  socket.on('typing done', (message) => socket.broadcast.emit('typing done', message));
});

setInterval(() => io.emit('time', Date.now()), 1000);
