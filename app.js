const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const session = require('express-session')
const cookieParser  = require('cookie-parser')
var Promise = require('bluebird');
var bodyParser = require('body-parser');
const app = express()
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt') //uses to hash password, don't need it in is Projekt. 
var http = require('http')
var fs = require('fs')
const port = 8000
let db = new sqlite3.Database("my-database.db")
const multer = require("multer");
const { EDESTADDRREQ } = require('constants');
var upload = multer({dest: 'views/uploads/'})
/* === Admin === */
const ADMIN = "Admin";
const PASSWORD = "test123";

/* === DataBase === */ 
function createTable(){
    var postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL)";
    db.run(postQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
const selectPosts = "SELECT * FROM posts";
const selectLimitPosts = "SELECT * FROM posts ORDER BY Id LIMIT 2"
createTable();
/*******************************************************************/

app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs',
    layoutsDir: __dirname + '/views/layouts/'
}))

    
app.use(express.static('node_modules/spectre.css/dist'))
app.use(express.static('CSS'))
app.use(express.static('views/images'))
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'hehahrhahe'
}))

app.use(function(req,res,next){
    const isLoggedIn = req.session.isLoggedIn
    res.locals.isLoggedIn = isLoggedIn
    next()
  })

/* ===== POST ===== */
app.post('/login', (req, res ) => {
    if(req.body.Username == ADMIN && req.body.Password == PASSWORD){
        req.session.isLoggedIn = true;
        res.redirect('/')
    }
})
app.post('/logOut', (req, res) => {
    if(req.session.isLoggedIn == true){
        req.session.isLoggedIn = false;
        res.redirect('/')
    }
    res.redirect('/')
})

app.post('/post', upload.any(),(req, res) => {
    const insertQuery = "INSERT INTO posts('Title', 'Description', 'Prise', 'Image') VALUES (?,?,?,?)";
    const values =  [req.body.title, req.body.description, req.body.prise,req.body.img]
    db.run(insertQuery,values, function(error){
        if(error){
            console.log(error)

        }
        else{
            res.redirect("/");
        }
    })
})
/* ===== GET ===== */ 
app.get('/', (req, res) => {
    db.all(selectPosts, [], async(error, data) => {
        if(error){
            throw error; 
        }
        res.render('index.hbs', {data})
    })
})
app.get('/login', (req, res) => {
    if(req.session.isLoggedIn == true){
        res.redirect('/')
    }else{ res.render('login.hbs') }
})
app.get('/contact', (req, res) => {
    res.render('contact.hbs')
})
app.get('/upload', (req, res) => {
    if(req.session.isLoggedIn ){
        res.render('upload.hbs')
    }
    else{
        res.redirect('/')
    }
})
/*Check the link later*/ 
app.get('/post', (req, res) => {
    db.all(selectPost, [], async(error, data) => {
        if(error){
            throw error; 
        }
    res.render('post.hbs', {data})
    })
})
app.get('/about', (req, res) => {
    res.render('about.hbs')
})

app.listen(port);



