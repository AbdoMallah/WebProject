const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const app = express()
var http = require('http')
var fs = require('fs')
const port = 8000


function onRequest(request, response){
    response.writeHead(200, {'Content-Type': 'text/html'})
    fs.readFile('../index.html', null, function(error, data){
        if(error){
        response.writeHead(404)
        response.write("File not found! :C")}
        else{
            response.write(data)
        }
        response.end()
    })
}
http.createServer(onRequest).listen(port)


// app.get('/', (req, res) => {
//     res.send('Hello World')
// })

// app.listen(port, () => {
//     console.log('Example app listening at http://localhost:${'+ port + '}')
// })