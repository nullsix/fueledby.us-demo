var socket = io.connect('http://fueledby.us');
var currentUser;
var contentUploadTimer;
var userIsTyping = false;
var TYPING_DELAY = 1000;

socket.on('download', function (data) {
  if (!userIsTyping) {
    $('#content').html(data);
    contentSaved();
  }
});

socket.on('currentUser', function(name) {
  setCurrentUser(name);
});

socket.on('activeUsers', function(names) {
  $('#activeUsers').html('<p>' + names + '</p>');
});

$(document).ready(function() {
  $('#content').wysiwyg();
  $('#content').keyup(userTyping);
  $('#username').keyup(createUser);
});

function userTyping() {
  clearTimeout(contentUploadTimer);
  userIsTyping = true;
  setStatus('Typing...');
  contentUploadTimer = setTimeout(uploadContent, TYPING_DELAY);
}

function uploadContent() {
  userIsTyping = false;
  contentSaved();
  socket.emit('upload', $('#content').html());
};

function createUser() {
  if (event.keyCode == 13) {
    socket.emit('createUser', $('#username').val());
  }
};

function contentSaved() {
  setStatus('Saved');
}

function setStatus(text) {
  $('#status').html('<p>' + text + '</p>');
}

function currentUserIsSet() {
  return !(typeof currentUser === 'undefined')
}

function setCurrentUser(name) {
  currentUser = name;
  $('#currentUser').html('<p>Hi, ' + name + '!</p>');
}

