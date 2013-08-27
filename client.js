var socket = io.connect('http://fueledby.us');
var name_has_been_set = false;

socket.on('download', function (data) {
    console.log("Received broadcast: " + data);
    $('#content').html(data);
});

socket.on('show names', function(names) {
  console.log("received show names");
    if(name_has_been_set == true) {
      $('#name').html('<p><b>Users:</b> ' + names + '</p>');
    }
});

$(document).ready(function() {
  $('#content').keyup(function() {
    socket.emit('upload', $('#content').html());
  });

  $('#username').keyup(function(event) {
    if (event.keyCode == 13) {
      socket.emit('set name', $('#username').val());
      name_has_been_set = true;
    }
  });
});
