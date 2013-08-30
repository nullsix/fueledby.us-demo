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
    var person = {socketId: socket.id, name: name}
    people.push(person);
    emit_names();
  });

  socket.on("disconnect", function() {
    for (var count = 0; count < people.length; count++) {
      var person = people[count];
      if(person.socketId == socket.id) {
        people.splice(count, 1);
      }
    };
    emit_names();
  });
});

function emit_names() {
  io.sockets.emit('show names', get_names());
}

function get_names() {
  var name_string = "";

  for (var count = 0; count < people.length; count++) {
    var person = people[count];
    var name = person.name;

    if (name_string == "") {
      name_string = name;

    } else {
      name_string += ", " + name;
    }
  }

  return name_string;
}
