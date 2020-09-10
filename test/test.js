var http = require('http');
var fs = require('fs');
http.createServer(function (req, res) {
  console.log("Hi")
  fs.readFile('../index.html', function(err, data) {
    console.log("Hi again")
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end();
  });
}).listen(8080);