const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const app = express()
var http = require('http')
var fs = require('fs')
const port = 8000



app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs'
}))

app.use(express.static('node_modules/spectre.css/dist'))
app.use(express.static('CSS'))
app.use(express.static('views/images')) 
/* ===== Render ===== */
app.get('/', (req, res) => {
    res.render('index.hbs')
})
app.get('/login', (req, res) => {
    res.render('login.hbs')
})
app.get('/contact', (req, res) => {
    res.render('contact.hbs')
})
app.get('/setting', (req, res) => {
    res.render('setting.hbs')
})
app.get('/post', (req, res) => {
    res.render('post.hbs')
})
app.get('/about', (req, res) => {
    res.render('about.hbs')
})

app.listen(port);








// function onRequest(request, response){
//     response.writeHead(200, {'Content-Type': 'text/html'})
//     fs.readFile('./index.html', null, function(error, data){
//         if(error){
//         response.writeHead(404)
//         response.write("File not found! :C")}
//         else{
//             response.write(data)
//         }
//         response.end()
//     })
// }
// http.createServer(onRequest).listen(port)