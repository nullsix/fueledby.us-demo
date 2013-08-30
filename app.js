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
var people = [];

io.sockets.on('connection', function (socket) {
  socket.emit('download', content);

  socket.on('upload', function(data) {
    content = data;
    socket.broadcast.emit('download', content);
  });

  socket.on('set name', function(name) {
    // sets the name to the name property on the socket
    // can be retrieved with Socket#get
    // this eliminates the need to track socket ids
    socket.set('name', name, function () {
      people.push(name);
      socket.emit('show names', get_names());
    });
  });

  socket.on("disconnect", function() {
    socket.get('name', function (err, name) {
      // Array#indexOf returns the index of an element if found
      // will return -1 if not found
      // if (idx >= 0) indicates element found
      var idx = people.indexOf(name);
      people.splice(idx, 1);
      emit_names();
    });
  });
});

function emit_names() {
  io.sockets.emit('show names', get_names());
}

function get_names() {
  // we are no longer tracking a JS object in the array
  // so we can just join the names using Array#join
  return people.join(",");
}
