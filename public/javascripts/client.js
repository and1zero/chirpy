var socket = io.connect('', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']});
var pathname = window.location.pathname.split('/');

// on load of page
$(document).ready(function(){
	// Typing timer to keep track when user types
	var typingTimer;
	var doneTypingInterval = 5000;

	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
		doneTyping();
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$('#datasend').click();
			$(this).focus();
			doneTyping();
		}
	});

	// when the user types
	$('#data').keyup(function(e) {
		if(e.which != 13) {
			var username = $('#myUsername').val();
			socket.emit('typing', username);
			typingTimer = setTimeout(doneTyping, doneTypingInterval);
		}
	});
	$('#data').keydown(function() {
		clearTimeout(typingTimer);
	});

  /* REGISTRATION PAGE */
  user_register();
});

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	if ($.inArray('waiting_room', pathname) > -1) {
    socket.emit('user_waiting', $('input#myUsername').val());
  }
});

// If the user is not registered
socket.on('unregistered_user', function() {
  window.location = '/';
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	$('#conversation').append('<p><strong>'+username + ':</strong> ' + data + '</p>');
});

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(users) {
	$('#users').empty();
	$.each(users, function(username, value) {
		$('#users').append('<li>' + value.username + '</li>');
	});
});

// Listener, when the app commands start game
socket.on('start_game', function(users) {
  var myUsername = $('input#myUsername').val();
  $.each(users, function(key, value) {
    if(value.username == myUsername) {
      window.location = '/game?username='+myUsername;
    }
  });
});

socket.on('userTyping', function(username, message) {
	$('#typers').html('<div id="'+username+'" style="font-style: italic;"><p>'+message+'</p></div>');
});

socket.on('userDoneTyping', function(username) {
	$('#typers #'+username).remove();
});

function doneTyping() {
	var username = $('#myUsername').val();
	socket.emit('doneTyping', username);
}

/*============= REGISTRATION PAGE ===============*/
function user_register() {
  $('#btn_register').click(function() {
    
    $('div[id^=control_group]').removeClass('error');
    $('.help-inline').remove();

    var username = $('input#register_username').val();
    var phone = $('input#register_phone').val();
    var email = $('input#register_email').val();

    /* Form Validation */
    if (username == '') {
      $('div#control_group_username').addClass('error');
      $('div#control_group_username .controls').append('<span class="help-inline">Fill in your username</span>');
      return false;
    } else if (username.length > 20) {
      $('div#control_group_username').addClass('error');
      $('div#control_group_username .controls').append('<span class="help-inline">The maximum letters for username is 20 characters</span>');
      return false;
    }
    if (phone == '') {
      $('div#control_group_phone').addClass('error');
      $('div#control_group_phone .controls').append('<span class="help-inline">Fill in your phone</span>');
      return false;
    }
    if (email == '') {
      $('div#control_group_email').addClass('error');
      $('div#control_group_email .controls').append('<span class="help-inline">Fill in your email</span>');
      return false;
    } else if (!is_valid_email(email)) {
      $('div#control_group_email').addClass('error');
      $('div#control_group_email .controls').append('<span class="help-inline">Fill in a valid email</span>');
      return false;
    }

    /* Registering the user in database */
    socket.emit('adduser', username, phone, email);
    window.location = '/waiting_room?username='+username;
    return false;
  });
}

function is_valid_email(str) {
   return (str.indexOf(".") > 2) && (str.indexOf("@") > 0);
}
