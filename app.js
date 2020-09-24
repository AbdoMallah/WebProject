const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const app = express()
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt') //uses to hash password, don't need it in is Projekt. 
var http = require('http')
var fs = require('fs')
const port = 8080
let db = new sqlite3.Database("database.db") 


const USERNAME = "Admin";
const PASSWORD = "20aDmIn20";
var status = 1;
/* === DataBase === */ 
function createTable(){
    var postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL)";
    db.run(postQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}

function insertPostInfo(Title, Description, Prise, Image){
    var insertQuery = "INSERT INTO posts('Title', 'Description', 'Prise', 'Image') VALUES ('" + Title + "', '" + Description + "','" + Prise + "','" + Image + "')";
    db.run(insertQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
function selectPosts(){
    var selectQuery = "SELECT * FROM posts";
    db.run(selectQuery, function(error,data){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued");  }
    })
}
function selectPost(Id){
    var selectQuery = "SELECT * FROM posts WHERE Id ==" + Id;
    db.run(selectQuery, function(error,data){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
function updatePost(Id, Title, Description, Prise, Image){
    var selectQuery = "UPDATE posts SET Title = " ||Title|| ", Description = "|| Description ||", Prise = "|| Prise ||",Image = "||Image||"  WHERE Id ==" || Id;
    db.run(selectQuery, function(error,data){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
var SPosts = selectPosts();
createTable();
insertPostInfo('Test2', 'hehek jieu e erea', '400', 'test1.jpg');

/* === Express-Handlebars === */ 
app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs',
    layoutsDir: __dirname + '/views/layouts/'
}))

app.use(express.static('node_modules/spectre.css/dist'))
app.use(express.static('CSS'))
app.use(express.static('views/images')) 
/* ===== Render ===== */
app.use(express.urlencoded({extended: false}))

app.get('/', (req, res) => {
    res.render('index.hbs', {status})
})
app.get('/login', (req, res) => {
    if(status == 0){
        req.redirect('/')
    }
    res.render('login.hbs')
})
app.post('/login', (req, res) => {
    if(req.body.Username == USERNAME && req.body.Password == PASSWORD){
        status = 0;
        res.redirect('/')
    }
})
app.get('/contact', (req, res) => {
    res.render('contact.hbs', {status})
})
app.get('/upload', (req, res) => {
    res.render('upload.hbs', {status})
})
app.get('/post', (req, res) => {
    res.render('post.hbs', {status})
})
app.get('/about', (req, res) => {
    res.render('about.hbs', {status})
})

app.listen(port);



