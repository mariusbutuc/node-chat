var
  // HTTP server and client functionality
  http  = require('http'),
  // filesystem-related functionality
  fs    = require('fs'),
  // filesystem path-related functionality
  path  = require('path'),
  // ability to derive a MIME type based on a filename extension
  mime  = require('mime'),
  // The cache object is where the contents of cached files are stored
  cache = {},
  port = process.env.VCAP_APP_PORT || 1337;

function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200,
    {'content-type': mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

var server = http.createServer(function (request, response) {
  var filePath = false;

  if (request.url === '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }

  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

server.listen(port, function () {
  console.log('Server listening on port ' + port);
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);
