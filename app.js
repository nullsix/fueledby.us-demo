var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

var contentFile = __dirname + '/content.html';
var content = getContent();
var contributorsFile = __dirname + '/contributors.json'
var contributors = getContributors();
var activeUsers = {};

app.listen(80);

function handler (req, res) {
  path = req.url;
  if (path == '/') {
    serveAsset(res, '/index.html');

  } else {
    serveAsset(res, path);
  }
}

function serveAsset(res, path) {
  fs.readFile(__dirname + path,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + path);
      }

      res.writeHead(200);
      res.end(data);
    }
  );
}

io.sockets.on('connection', function (socket) {
  socket.emit('download', content);
  sendActiveUsers();

  socket.on('upload', function(data) {
    content = data;
    saveContent(content);
    socket.broadcast.emit('download', content);
  });

  socket.on('logIn', function(name) {
    if (name in contributors) {
      user = contributors[name];
    } else {
      user = { name: name }
      newContributor(user);
    }

    socket.set('currentUser', user, function() {
      activeUsers[name] = user;
      socket.emit('currentUser', user);
      sendActiveUsers();
    });
  });

  function newContributor(user) {
    contributors[user.name] = user;
    saveContributors(contributors);
  }

  socket.on('disconnect', function() {
    socket.get('currentUser', function (err, currentUser) {
      if (currentUser && currentUser.name in activeUsers) {
        delete activeUsers[currentUser.name];
      }
      sendActiveUsers();
    });
  });
});

function getContent() {
  if (!fs.existsSync(contentFile)) {
    saveContent('<p>You can start typing here!</p>');
  }

  return fs.readFileSync(contentFile).toString();
}

function saveContent(content) {
  fs.writeFileSync(contentFile, content)
}

function getContributors() {
  if(!fs.existsSync(contributorsFile)) {
    saveContributors({});
  }

  var contributorsBuffer = fs.readFileSync(contributorsFile);
  var contributorsString = contributorsBuffer.toString();
  return JSON.parse(contributorsString);
}

function saveContributors(contributors) {
  var contributorsString = JSON.stringify(contributors);
  fs.writeFileSync(contributorsFile, contributorsString);
}

function sendActiveUsers() {
  io.sockets.emit('activeUsers', activeUsers);
}

