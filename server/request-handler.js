/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var fs = require('fs');
var path = require('path');


var storage;
var pathToMessages = path.join(__dirname, './messages.json');
// fs.readFile(pathToMessages, function(err, data) {
//   // console.log('data',data.toString());
//   if (err) {
//    // TODO FIXME
//   } else {
//     storage = JSON.parse(data.toString());
//   }
// });

// create new read stream
messagesData = '';
var messageReadStream = fs.createReadStream(pathToMessages);
// on new data, append the data
messageReadStream.on('data', function (chunk) {
  messagesData += chunk;
});
// on end, process the data
messageReadStream.on('end', function (chunk) {
  storage = JSON.parse(messagesData.toString());
});





var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

var requestHandler = function(request, response) {
  // console.log(storage);
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  // console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // The outgoing status.
  var statusCode;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  if (!request.url.includes('/classes/messages')) {
    var pathToRequestedFile = path.join(__dirname, '../2016-09-chatterbox-client/client');

    if (request.url === '/' || request.url.includes('?')) {
     // we will give them index.html
      pathToRequestedFile += '/index.html';
    } else {
      // test if the file exists, if not send 404, else send the file
      pathToRequestedFile += request.url;
    }

    fs.readFile(pathToRequestedFile, function(err, data) {
      if (err) {
        statusCode = 404;
        response.writeHead(statusCode, headers);
        response.end('error');
      }

      var extensionName = path.extname(pathToRequestedFile);
      var contentType = 'text/html';

      if (extensionName === '.js') {
        contentType = 'text/javascript';
      } else if (extensionName === '.css') {
        contentType = 'text/css';
      }

      headers['Content-Type'] = contentType;

      statusCode = 200;
      response.writeHead(statusCode, headers);
      response.end(data);
    });
  } else { 
    if (request.method === 'GET' || request.method === 'OPTIONS') {
      statusCode = 200;

      headers['Content-Type'] = 'application/json';
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(storage));
    } else if (request.method === 'POST') {
      console.log('received POST request');
      statusCode = 201;

      request.on('data', function (data) {
        var body = data;
   
        try { 
          // JSON.parse(body.toString());
          var newMessage = JSON.parse(body.toString());
          newMessage.objectId = Math.floor(Math.random() * 1e6).toString();
          // If so, push it onto the storage.results array
          storage.results.push(newMessage);
          // fs.writeFile(pathToMessages, JSON.stringify(storage));
          var messageWriteStream = fs.createWriteStream(pathToMessages);
          messageWriteStream.write(JSON.stringify(storage));
          messageWriteStream.end();
        } catch (e) {
        }


        if (body.length > 1e6) {
          request.connection.destroy();
        }
      });

      // TODO: proper content-type
      headers['Content-Type'] = 'text/plain';
      response.writeHead(statusCode, headers);
      response.end('success');
    } else if (request.method === 'DELETE') {
      request.on('data', function (data) {
        var body = JSON.parse(data.toString());
        var indexToDelete;
        storage.results.forEach(function(item, index) {
          if (item.id === body) {
            indexToDelete = index;
          }
        });
        if (typeof indexToDelete === 'number') {
          storage.results.splice(indexToDelete, 1);
        }
      });
      response.end('success');
    }
  }
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.

module.exports = requestHandler;

