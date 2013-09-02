var socket = io.connect('http://fueledby.us');
var currentUser;
var activeUsers;
var currentVersion;
var contentToServerTimer;
var isUserTyping = false;
var TYPING_DELAY = 1000;

socket.on('connect', function() {
  if($.cookie('currentUser')) {
    socket.emit('logIn', $.cookie('currentUser'));
  } else {
    $('#username').show().focus();
  }
});

socket.on('toClient', function (version) {
  if (!isUserTyping) {
    currentVersion = version;
    $('#content').html(currentVersion.content);
    contentSaved();
    if(userHasLoggedIn()) {
      setCaretAtEndOfContent();
    }
  }
});

function userHasLoggedIn() {
  return !(typeof currentUser === 'undefined')
}

function setCaretAtEndOfContent() {
  var c = $('#content')[0];
  placeCaretAtEnd(c);
}

// Function courtesy of StackOverflow.
// StackOverflow Question:
//   http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442
//   by avsej: http://stackoverflow.com/users/98509/avsej
// Answer:
//   http://stackoverflow.com/a/3866442/249218
//   by Nico Burns: http://stackoverflow.com/users/140293/nico-burns
function placeCaretAtEnd(el) {
  el.focus();
  if (typeof window.getSelection != "undefined" &&
      typeof document.createRange != "undefined") {
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(false);
    textRange.select();
  }
}

socket.on('currentUser', function(user) {
  currentUser = user;
  $.cookie('currentUser', currentUser.name);
  $('#currentUser').html('<p>Hi, ' + currentUser.name + '!</p>');
  setCaretAtEndOfContent();
});

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
  clearTimeout(contentToServerTimer);
  isUserTyping = true;
  setStatus('Typing...');
  contentToServerTimer = setTimeout(sendContentToServer, TYPING_DELAY);
}

function sendContentToServer() {
  isUserTyping = false;
  contentSaved();
  var versionPatch =
    { content: $('#content').html(), lastVersionId: currentVersion.version };
  socket.emit('toServer', versionPatch);
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


