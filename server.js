'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const cleverbot = require('better-cleverbot-io');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use(express.static('public'))
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

// Cleverbot will attempt to join if there is no one else connected
const bot = new cleverbot(process.env.CLEVERBOT_API_USER, process.env.CLEVERBOT_API_KEY);

bot.setNick('jenkins');

// Remember the clients
let clients = {};
// cache chat histories
const MAX_CHAT_ITEMS = 20; // max chat messages to remember
let chats = [];

io.use(function(socket, next) {
  var handshake = socket.request;
  next();
});

io.on('connection', (socket) => {
  socket.emit('load connected users', clients);
  socket.emit('load chat histories', chats);

  socket.on('user connected', (username) => {
    // let server generate UUID
    socket.username = username;
    // save it in list of clients
    clients[socket.id] = username;
    socket.broadcast.emit('log', socket.username + ' has joined the chat');
    if (Object.keys(clients).length == 1) {
      socket.emit('log', 'Don\'t worry, you are not alone!');
    } else {
      // Update online user list for other users
      socket.broadcast.emit('load connected users', clients);
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('log', clients[socket.id] + ' has left the chat');
    delete clients[socket.id];
    // Update online user list for other users
    socket.broadcast.emit('load connected users', clients);
  });

  bot.create(function(err, session) {
    socket.on('chat message', (message) => {
      chats.push(message);
      if (chats.length > MAX_CHAT_ITEMS) {
        chats.splice(0, 1);
      }
      if (Object.keys(clients).length == 1) {
        // let cleverbot answer
        bot.ask(message.data, function(err, response) {
          // we should log the response to history too
          let botMessage = {
            username: 'jenkins',
            data: '...',
            timestamp: Date.now()
          };
          if (err) {
            console.error(err);
            botMessage.data = 'Seems like cleverbot is choking on its own arrogance.';
          } else {
            botMessage.data = response;
          }
          chats.push(botMessage)
          socket.emit('chat message', botMessage);
        });
      } else {
        // Sending data to everyone except the sender
        socket.broadcast.emit('chat message', message);
      }
    });
  });

  socket.on('typing', (message) => socket.broadcast.emit('typing', socket.username + ' is typing...'));
  socket.on('typing done', (message) => socket.broadcast.emit('typing done', message));
});

setInterval(() => io.emit('time', Date.now()), 1000);
