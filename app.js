/* Global Configuration */
var config = require('./config.json');

HOST = config.app.host,
PORT = config.app.port,
_DB_HOST_ = config.couch.host,
_DB_PORT_ = config.couch.port,
_DB_NAME_ = config.couch.db,
_DB_USER_ = config.couch.user,
_DB_PASS_ = config.couch.pass,
MAX_PLAYERS = config.app.max_players

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , nano = require('nano')('http://'+_DB_USER_+':'+_DB_PASS_+'@'+_DB_HOST_+':'+_DB_PORT_);

var app = module.exports = express();

/**
 * Site Configuration
 */
app.configure(function(){
  app.set('port', process.env.PORT || PORT);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('put-secret-string-here'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(logErrors);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

/**
 * Database Configuration
 */
var db = nano.use(_DB_NAME_);

/**
 * Insert function
 */
function insert_doc(doc, tried) {
  db.insert(doc, doc.username, function (error, body) {
    if(error) {
      if(error.message === 'no_db_file' && tried < 1) {
        // create database and retry
        return nano.db.create(_DB_NAME_, function () {
          insert_doc(doc, tried+1);
        });
      } else if (error.message === 'Document update conflict.' && error.status_code === 409) {
        // if the document already exist, we overwrite it
        db.get(doc.username, { revs_info: false }, function(err, body) {
          if (!err) {
            insert_doc({username: doc.username, phone: doc.phone, email: doc.email, date: Date.now(), _rev:body._rev}, tried+1);
          } else {
            return console.log(err);
          }
        });
      } else {
        // If there is any uncatched error
        return console.log(error);
      }
    } else {
      console.log('Insert username '+doc.username+' into '+_DB_NAME_);
    }
  });
}

/**
 * Routing
 */
app.get('/', routes.index);
app.get('/waiting_room', routes.waiting_room);
app.get('/controller', routes.controller);
app.get('/game', routes.game);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port') +", on " + app.get('env') + " environment");
});

var io = require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] }).listen(server);
io.set('log level', 1);

/*=========== ERROR HANDLING ===============*/
function logErrors(err, req, res, next) {
  console.log(err.stack);
  next(err);
}

/*=========== SERVER SCRIPT ==============*/
// users which are currently connected to the chat
var users = {}, count = 0;
var users_waiting = [];
var users_game = [];

/* users_waiting methods */
users_waiting.find_by_username = function(username) {
  for (var i=0, len=this.length; i<len; i++) {
      if (username == this[i].username) return this[i];
   }
   return null;
}

users_waiting.sort_by_date = function() {
    this.sort(function(a,b) {
        return b.date - a.date;
    });
};

users_waiting.remove_by_username = function(username) {
   for (var i=0, len=this.length; i<len; i++) {
      if (username == this[i].username) return this.splice(i, 1)[0];
   }
   return null;
};

/* users_game methods */
users_game.find_by_username = function(username) {
  for (var i=0, len=this.length; i<len; i++) {
      if (username == this[i].username) return this[i];
   }
   return null;
}

users_game.sort_by_date = function() {
    this.sort(function(a,b) {
        return b.date - a.date;
    });
};

users_game.remove_by_username = function(username) {
   for (var i=0, len=this.length; i<len; i++) {
      if (username == this[i].username) return this.splice(i, 1)[0];
   }
   return null;
};

io.sockets.on('connection', function (socket) {

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.user.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username, phone, email){
    // Add the user into database
    insert_doc({username: username, phone: phone, email: email, date: Date.now()}, 0);
	});

  // If the user already registered and in waiting room
  socket.on('user_waiting', function(username) {
    // try to fetch the user from database
    db.get(username, { revs_info: false }, function(error, user) {
      if (!error) {
        // If the user exists, we process it (updating the time queued)
        db.insert({username: user.username, phone: user.phone, email: user.email, date: Date.now(), room: 'waiting_room', _rev: user._rev}, user.username, function(error, body){
          if (!error) {
            db.get(username, { revs_info: false }, function(error, user_updated) {
              if (!error) {
	              // we store the username in the socket session for this client
	              socket.user = user_updated;
	              // add the client's username to the global list
	              users[user_updated.username] = user_updated;
                if (users_waiting.find_by_username(user_updated.username) == null) {
                  users_waiting.push(user_updated);
                }
	              // echo to client they've connected
	              socket.emit('updatechat', 'SERVER', 'you have connected');
	              // echo globally (all clients) that a person has connected
	              socket.broadcast.emit('updatechat', 'SERVER', user_updated.username + ' has connected');
	              // update the list of users in chat, client-side
	              io.sockets.emit('updateusers', users_waiting);
              }
            }); // End of fetching updated user
          }
        }); // End of updating user
      } else {
        socket.emit('unregistered_user');
      }
    });

    // if the player quota has been met, it will redirect the users to the game
    if(users_waiting.length >= MAX_PLAYERS && users_game.length <= MAX_PLAYERS) {
      for (var i=0, len=MAX_PLAYERS; i<len; i++) {
        if (users_game.find_by_username(users_waiting[i].username) == null) {
          users_game.push(users_waiting[i]);
        }
      }
      users_waiting.splice(0, MAX_PLAYERS);
      io.sockets.emit('start_game', users_game);
    }
    update_controller();
  }); // End of user_waiting socket

  // On game connection
  socket.on('game_connect', function(username) {
    // try to fetch the user
    if (users_game.find_by_username(username) != null) {
      var user = users_game.find_by_username(username);
      user.score = 0;
      socket.broadcast.emit('updatechat', 'SERVER', user.username + ' has joined the game');
    } else {
      socket.emit('unregistered_user');
    }
    update_controller();
  });

  socket.on('add_score', function(username) {
    if (users_game.find_by_username(username) != null) {
      var user = users_game.find_by_username(username);
      user.score += 1;
    }
    update_controller();
  });

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
    if (socket.user !== undefined) {
      // remove the username from global usernames list
		  delete users[socket.user.username];
      users_waiting.remove_by_username(socket.user.username);
		  // echo globally that this client has left if the user exists
		  socket.broadcast.emit('updatechat', 'SERVER', socket.user.username + ' has disconnected');
		  // update list of users in chat, client-side
		  io.sockets.emit('updateusers', users_waiting);
    }
    update_controller();
	});

	// when the user types
	socket.on('typing', function(username){
		socket.broadcast.emit('userTyping', username, username + ' is typing');
	});
	socket.on('doneTyping', function(username) {
		socket.broadcast.emit('userDoneTyping', username);
	});

	// Controller
	// When the controller started
  socket.on('controller_connect', function() {
    update_controller();
  });
	
}); // End of socket

function update_controller() {
  io.sockets.emit('update_controller', users_waiting, users_game);
  return false;
}

/*=========== SERVER SCRIPT ==============*/
