var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function handler (req, res) {
  path = req.url;
  if (path == '/') { // Read the index.html
    fs.readFile(__dirname + '/index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
      });

  } else { // Read the asset requested
    fs.readFile(__dirname + path,
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading ' + path);
        }

        res.writeHead(200);
        res.end(data);
      });
  }
}

var content = "<p contenteditable>You can start typing here!</p>";
var names = "";

io.sockets.on('connection', function (socket) {
  socket.emit('download', content);

  socket.on('upload', function(data) {
    content = data
    socket.broadcast.emit('download', content);
  });

  socket.on('set name', function(name) {
    socket.set('name', name);
    if (names == "") {
      names = name;
    } else {
      names += ", " + name;
    }

    socket.broadcast.emit('show names', names);
    socket.emit('show names', names);
  });
});
