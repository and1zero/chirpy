// on connection
socket.on('connect', function() {
	if ($.inArray('game', pathname) > -1) {
    socket.emit('game_connect', $('input#myUsername').val());
  }
});

$(document).ready(function() {
  $('#game').hammer({ prevent_default: true }).bind('swipe', function(evt) {
    socket.emit('add_score', $('input#myUsername').val());
  });
});
