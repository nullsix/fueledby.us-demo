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
    hookUpCommentEvents();
    if(userHasLoggedIn()) {
      setCaretAtEndOfContent();
    }
  }
});

var commentSpan = '<span class="commentIcon" contenteditable="false"><i class="icon icon-comment"></i></span>';

function addCommentLine(el) {
  if (nothingBeforeThisParagraph(el) || noSpanBeforeThisElement(el)) {
    el.before(commentSpan);
  }
}

function nothingBeforeThisParagraph(el) {
  return (el[0].nodeName == 'P') && (typeof el.prev()[0] === 'undefined')
}

function noSpanBeforeThisElement(el) {
  return el.prev()[0].nodeName != "SPAN"
}

function hookUpCommentEvents() {
  $('#content').find('p').each(function() {
    hookUpCommentEvent($(this));
  });
}

function hookUpCommentEvent(pTag) {
  var icon = pTag.prev();
  pTag.hover(
    function() { icon.css('opacity', '1'); },
    function() { icon.css('opacity', '0'); }
  );
  icon.hover(
    function() { icon.css('opacity', '1'); },
    function() { icon.css('opacity', '0'); }
  );

  // Insert the actual comment box
  icon.click(function(e) {
      var elementToInsertAfter = skipOverComments(pTag);
      elementToInsertAfter.after('<div class="comments" contenteditable="true" style="margin-left:15px;"><textarea placeholder="Comment..." /></div>');
      elementToInsertAfter.next().find('textarea').focus();
  });
}

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
    u = activeUsers[username];
    names.push('<span class="user' + u.number + 'Name user' + u.number +
               '">'+ username +'</span>');
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
  $('#content').on('keyup', colorUserText);
  $('#content').keydown(processKeyDown);
  $('#content').keyup(processKeyUp);
});

function processKeyDown(e) {
  if(e.keyCode == 13) { // Enter
    var text = window.getSelection().focusNode;
    var ptag = $(text.parentElement);
    if(ptag[0].nodeName == 'P') {
      e.preventDefault();
      var newEl = ptag.clone();
      var elementToPlaceAfter = skipOverComments(ptag);
      elementToPlaceAfter.after(newEl);

      placeCaretAtEnd(newEl[0]);
      newEl.html('<br>');
      addCommentLine(newEl);
      hookUpCommentEvent(newEl);
    }
  }

};
function processKeyUp(e) {
  var node = $(window.getSelection().focusNode)
  var name = node[0].nodeName;
  if (name == "DIV") {
    var textarea = node.find('textarea')
    textarea.text(textarea.val());
  }
}

function skipOverComments(element) {
  while ((!(typeof(element.next()[0]) === 'undefined')) &&
         (element.next()[0].nodeName == 'DIV')) {
      element = element.next();
  }
  return element;
}

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

function colorUserText(e) {
  var editedNode = $(window.getSelection().focusNode.parentElement);
  if (editedNode[0].nodeName == "P") {
    editedNode.removeClass();
    editedNode.addClass('user'+currentUser.number);
  }
}

function contentSaved() {
  setStatus('Saved');
}

function setStatus(text) {
  $('#status').html('<p>' + text + '</p>');
}

