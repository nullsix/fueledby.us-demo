var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , _ = require('underscore');

var contentVersionsFile = __dirname + '/contentVersions.json';
var contentVersions = getContentVersions();
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
  socket.emit('toClient', contentVersions[contentVersions.length-1]);
  sendActiveUsers();

  socket.on('toServer', function(versionPatch) {
    var newVersion = { content: versionPatch.content, version: contentVersions.length }
    contentVersions.push(newVersion);
    saveContentVersions(contentVersions);
    socket.broadcast.emit('toClient',
                          contentVersions[contentVersions.length-1]);
  });

  socket.on('logIn', function(name) {
    if (name in contributors) {
      user = contributors[name];
    } else {
      user = { name: name, number: _.keys(contributors).length+1 }
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

function getContentVersions() {
  if (!fs.existsSync(contentVersionsFile)) {
    var defaultVersions =
      [ { content: '<p>You can start typing here!</p>', version: 0 } ]
    saveContentVersions(defaultVersions);
  }

  var contentVersionsBuffer = fs.readFileSync(contentVersionsFile);
  return JSON.parse(contentVersionsBuffer.toString());
}

function saveContentVersions(contentVersions) {
  var contentString = JSON.stringify(contentVersions);
  fs.writeFileSync(contentVersionsFile, contentString)
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

