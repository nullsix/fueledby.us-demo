var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function handler (req, res) {
  path = req.url;
  if (path == '/') { // Read the index.html
    serveAsset(res, "/index.html");

  } else { // Read the asset requested
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

var content = "<p contenteditable>You can start typing here!</p>";
var people = [];

io.sockets.on('connection', function (socket) {
  socket.emit('download', content);

  socket.on('upload', function(data) {
    content = data;
    socket.broadcast.emit('download', content);
  });

  socket.on('set name', function(name) {
    socket.set('name', name, function () {
      people.push(name);
      socket.emit('show names', get_names());
    });
  });

  socket.on("disconnect", function() {
    socket.get('name', function (err, name) {
      var idx = people.indexOf(name);
      if (idx >= 0) {
        people.splice(idx, 1);
      }
      emit_names();
    });
  });
});

function emit_names() {
  io.sockets.emit('show names', get_names());
}

function get_names() {
  return people.join(", ");
}
