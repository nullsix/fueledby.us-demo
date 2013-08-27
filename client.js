$(document).ready(function() {
  $('#content').keyup(function() {
    socket.emit('upload', $('#content').html());
  });
});
