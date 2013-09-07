var socket = io.connect('http://fueledby.us');
var currentUser;
var activeUsers;
var currentVersion;
var contentToServerTimer;
var isUserTyping = false;
var TYPING_DELAY = 1000;

//////////////////////////////////////////////////////////////////////
// Socket Messages
//////////////////////////////////////////////////////////////////////

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
    hookUpCommentRemoveEvents();
    hookUpCommentReplyEvents();
    if(userHasLoggedIn()) {
      setCaretAtEndOfContent();
    }
  }
});

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

//////////////////////////////////////////////////////////////////////
// Document Ready
//////////////////////////////////////////////////////////////////////

$(document).ready(function() {
  $('#username').keyup(logIn);
  $('#content').wysiwyg();
  $('#content').keyup(userTyping);
  $('#content').on('keyup', colorUserText);
  $('#content').keydown(handleNewLine);
  $('#content').keyup(persistCommentText);
});


//////////////////////////////////////////////////////////////////////
// Comments
//////////////////////////////////////////////////////////////////////

var commentSpan = '<span class="commentIcon" contenteditable="false"><i class="icon icon-comment"></i></span>';

function addCommentLine(el) {
  if (nothingBeforeThisParagraph(el) || noSpanBeforeThisElement(el)) {
    userTyping();
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
    elementToInsertAfter.after(
      '<div class="comments user' + currentUser.number +
        '" contenteditable="true">'+
        '<textarea placeholder="Comment..." />' +
        '&nbsp;<i class="icon icon-remove"></i><br>' +
        '<small class="muted">' +
          'comment from ' + currentUser.name +
        '</small>' +
        '<div><small>' +
        '<a href="#" class="reply-link">reply to comment</a>' +
        '</small></div>' +
      '</div>');
    var commentElement = elementToInsertAfter.next();
    var replyElement = commentElement.find('.reply-link');
    commentElement.find('textarea').focus();
    hookUpCommentRemoveEvent(elementToInsertAfter.next().find('i'));
    hookUpCommentReplyEvent(replyElement, commentElement);
    userTyping();
  });
}

function hookUpCommentRemoveEvents() {
  $('#content').find('.comments').find('i').each(function() {
    hookUpCommentRemoveEvent($(this));
  });
}

function hookUpCommentRemoveEvent(el) {
  el.click(function(e) {
    placeCaretAtEnd($(this).parent().prev()[0]);
    $(this).parent().remove();
    userTyping();
  });
}

function hookUpCommentReplyEvents() {
  $('#content').find('.comments').each (function() {
    var comment = $(this);
    comment.find('.reply-link').each(function() {
      hookUpCommentReplyEvent($(this), comment);
    })
  });
}

function hookUpCommentReplyEvent(reply, comment) {
  reply.click(function(e) {
    e.preventDefault();
    $(this).before('<div class="reply user' + currentUser.number +'">' +
                     '<div class="reply-input"></div>' +
                     // '<input type="text" class="reply-input"></input>' +
                     '<br><small class="muted reply-user' +
                     '">reply by ' + currentUser.name + '</small>' +
                   '</div>');
    placeCaretAtEnd(comment.find('.reply-input').last()[0]);
    console.log(comment.find('.reply-input').last());
    userTyping();
  });
}

/////////////////////////////////////////////////////////////////////
// Utility Functions
/////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////
// User Names
//////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////
// Key Press Functions
//////////////////////////////////////////////////////////////////////

function handleNewLine(e) {
  //TODO: This breaks adding a new line in the middle/end of a line...
  if(e.keyCode == 13) { // Enter
    processEnter(e);
  }
};

function processEnter(e) {
  var sel = window.getSelection();
  var focus = $(sel.focusNode);
  var el;
  if(focus[0].nodeName == '#text') {
    // Focus is with the text in the p tag.
    // Is the cursor at the end of the line?
    if (sel.extentOffset == sel.focusNode.textContent.length) {
      el = $(focus[0].parentElement);
    } else { // If the cursor isn't at end of line, treat it normally.
      return;
    }
  } else if (focus[0].nodeName == 'P') {
    // Focus is with the p tag itself.
    el = focus;
  } else {
    // We don't care about this, because it isn't a p tag!
    return;
  }

  e.preventDefault();
  var newEl = el.clone();
  var elementToPlaceAfter = skipOverComments(el);
  elementToPlaceAfter.after(newEl);

  placeCaretAtEnd(newEl[0]);
  newEl.html('<br>');
  addCommentLine(newEl);
  hookUpCommentEvent(newEl);
}

function persistCommentText(e) {
  var node = $(window.getSelection().focusNode)
  var name = node[0].nodeName;
  if (name == "DIV") {
    var textarea = node.find('textarea')
    textarea.text(textarea.val()); // Persist the text area.
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
  setStatus('Editing...');
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

