// on connection, prompting the list of users
socket.on('connect', function() {
	if ($.inArray('controller', pathname) > -1) {
    socket.emit('controller_connect');
  }
});

// listener, whenever the server emits update_controller
socket.on('update_controller', function(users_waiting, users_game) {
	$('table#user_waiting tbody').empty();
	$('table#user_game tbody').empty();
  if(users_waiting) {
	  $.each(users_waiting, function(key, value) {
      user = value;
      html = '<tr>';
      html += '<td>'+user.username+'</td>';
      html += '<td>'+user.phone+'</td>';
      html += '<td>'+user.email+'</td>';
      html += '<td>'+new Date(user.date)+'</td>';
		  $('table#user_waiting tbody').append(html);
	  });
  }

  if(users_game) {
    $.each(users_game, function(key, value) {
      user = value;
      html = '<tr id="'+user.username+'">';
      html += '<td>'+user.username+'</td>';
      html += '<td class="score">'+user.score+'</td>';
      html += '<td>'+new Date(user.date)+'</td>';
		  $('table#user_game tbody').append(html);
	  });
  }
});

socket.on('update_score', function(users) {

});
