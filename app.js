const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const app = express()
const sqlite3 = require('sqlite3')
var http = require('http')
var fs = require('fs')
const port = 8000
let db = new sqlite3.Database("database.db") 

/* === Admin Info === */
const USERNAME = "ADMIN";
const PASSWORD = "test123";
var status =0;
/* === DataBase === */ 
function createTable(){
    var postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL,  PosterID NUMBER INTEGER , FOREIGN KEY (PosterID) REFERENCES users (Id))";
    db.run(postQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}

function insertPostInfo(Title, Description, Prise, Image, PosterID){
    var insertQuery = "INSERT INTO posts('Title', 'Description', 'Prise', 'Image', 'PosterID') VALUE ("+ Title +", "+ Description +","+ Prise +"," + Image +","+ PosterID + ")";
    db.run(insertQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
function selectPosts(){
    var selectQuery = "SELECT * FROM posts";
    db.run(selectQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
function selectPost(Id){
    var selectQuery = "SELECT * FROM posts WHERE Id ==" + Id;
    db.run(selectQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
function updatePost(Id, Title, Description, Prise, Image){
    var selectQuery = "UPDATE posts SET Title = "+Title+", Description = "+Description +", Prise = "+Prise+",Image = "+Image+"  WHERE Id ==" + Id;
    db.run(selectQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}

/* === Express-Handlebars === */ 
app.set('view engine', 'handlebars');
app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
}))

app.use(express.static('node_modules/spectre.css/dist'))
app.use(express.static('CSS'))
app.use(express.static('views/images')) 
/* ===== Render ===== */
app.get('/', (req, res) => {
    res.render('index.hbs',{status})
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



