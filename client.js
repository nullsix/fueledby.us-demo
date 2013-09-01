var socket = io.connect('http://fueledby.us');
var currentUser;
var activeUsers;
var contentUploadTimer;
var isUserTyping = false;
var TYPING_DELAY = 1000;

socket.on('connect', function() {
  if($.cookie('currentUser')) {
    socket.emit('logIn', $.cookie('currentUser'));
  } else {
    $('#username').show();
  }
});

socket.on('download', function (data) {
  if (!isUserTyping) {
    $('#content').html(data);
    contentSaved();
  }
});

socket.on('currentUser', function(currentUser) {
  setCurrentUser(currentUser);
});

function setCurrentUser(user) {
  currentUser = user;
  $.cookie('currentUser', currentUser.name);
  $('#currentUser').html('<p>Hi, ' + currentUser.name + '!</p>');
}

socket.on('activeUsers', function(users) {
  activeUsers = users;

  var names = getActiveUsersNames();

  $('#activeUsers').html('<p>' + getActiveUserString(names)+ '</p>');
});

function getActiveUsersNames() {
  var names = [];
  for(var username in activeUsers) {
    names.push(username);
  }
  return names;
}

function getActiveUserString(names) {
  if (names.length == 0) {
    return 'No logged in users...';
  } else {
    return '<b>Active Users:</b> ' + names.join(', ');
  }
}

$(document).ready(function() {
  $('#content').wysiwyg();
  $('#content').keyup(userTyping);
  $('#username').keyup(logIn);
});

function userTyping() {
  clearTimeout(contentUploadTimer);
  isUserTyping = true;
  setStatus('Typing...');
  contentUploadTimer = setTimeout(uploadContent, TYPING_DELAY);
}

function uploadContent() {
  isUserTyping = false;
  contentSaved();
  socket.emit('upload', $('#content').html());
};

function logIn() {
  if (event.keyCode == 13) {
    socket.emit('logIn', $('#username').val());
  }
};

function contentSaved() {
  setStatus('Saved');
}

function setStatus(text) {
  $('#status').html('<p>' + text + '</p>');
}


