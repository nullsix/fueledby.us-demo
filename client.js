var socket = io.connect('http://fueledby.us');
var nameHasBeenSet = false;
var contentUploadTimerId;

socket.on('download', function (data) {
  $('#content').html(data);
});

socket.on('show names', function(names) {
  if(nameHasBeenSet == true) {
    $('#name').html('<p><b>Users:</b> ' + names + '</p>');
  }
});


$(document).ready(function() {
  $('#content').keyup(resetContentUploadTimer);
  $('#username').keyup(processUsername);
});

function resetContentUploadTimer() {
  clearTimeout(contentUploadTimerId);
  contentUploadTimerId = setTimeout(uploadContent, 1000);
}

function uploadContent () {
  socket.emit('upload', $('#content').html());
};

function processUsername () {
  if (event.keyCode == 13) {
    socket.emit('set name', $('#username').val());
    nameHasBeenSet = true;
  }
};
