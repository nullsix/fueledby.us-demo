var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

var contentFile = __dirname + '/content.html';
var content = getContent();
var people = [];

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

  socket.on('upload', function(data) {
    content = data;
    saveContent(content);
    socket.broadcast.emit('download', content);
  });

  socket.on('set name', function(name) {
    socket.set('name', name, function () {
      people.push(name);
      emitNames();
    });
  });

  socket.on('disconnect', function() {
    socket.get('name', function (err, name) {
      var idx = people.indexOf(name);
      if (idx >= 0) {
        people.splice(idx, 1);
      }
      emitNames();
    });
  });
});

function getContent() {
  if (fs.existsSync(contentFile)) {
    return fs.readFileSync(contentFile).toString();
  }
}

function saveContent(content) {
  fs.writeFile(contentFile, content, function (err) {
    if (err) { throw err; }
  });
}

function emitNames() {
  io.sockets.emit('show names', getNames());
}

function getNames() {
  return people.join(', ');
}
