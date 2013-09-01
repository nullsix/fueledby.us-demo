var socket = io.connect('http://fueledby.us');
var contentUploadTimerId;
var currentUser;

socket.on('download', function (data) {
  $('#content').html(data);
});

socket.on('currentUser', function(name) {
  setCurrentUser(name);
});

socket.on('activeUsers', function(names) {
  $('#activeUsers').html('<p>' + names + '</p>');
});

$(document).ready(function() {
  $('#content').wysiwyg();
  $('#content').keyup(resetContentUploadTimer);
  $('#username').keyup(createUser);
});

function resetContentUploadTimer() {
  clearTimeout(contentUploadTimerId);
  contentUploadTimerId = setTimeout(uploadContent, 1000);
}

function uploadContent() {
  socket.emit('upload', $('#content').html());
};

function createUser() {
  if (event.keyCode == 13) {
    socket.emit('createUser', $('#username').val());
  }
};

function currentUserIsSet() {
  return !(typeof currentUser === 'undefined')
}

function setCurrentUser(name) {
  currentUser = name;
  $('#currentUser').html('<p>Hi, ' + name + '!</p>');
}

