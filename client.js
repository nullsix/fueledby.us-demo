var socket = io.connect('http://fueledby.us');
var nameHasBeenSet = false;

socket.on('download', function (data) {
  $('#content').html(data);
});

socket.on('show names', function(names) {
  if(nameHasBeenSet == true) {
    $('#name').html('<p><b>Users:</b> ' + names + '</p>');
  }
});

$(document).ready(function() {
  $('#content').keyup(uploadContent);
  $('#username').keyup(processUsername);
});

var uploadContent = function() {
    socket.emit('upload', $('#content').html());
};

var processUsername = function() {
  if (event.keyCode == 13) {
    socket.emit('set name', $('#username').val());
    nameHasBeenSet = true;
  }
};
