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

io.sockets.on('connection', function (socket) {
  socket.on('upload', function(data) {
    socket.broadcast.emit('download', data);
  });
});
