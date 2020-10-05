const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const session = require('express-session')
const cookieParser  = require('cookie-parser')
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt') //uses to hash password, don't need it in is Projekt. 
const http = require('http')
const fs = require('fs')
const path = require('path')
const multer = require("multer");
const app = express()
const port = 8000
let db = new sqlite3.Database("database.db")
/* === Admin === */
const ADMIN = "Admin";
const PASSWORD = "test123";
/* === DataBase === */ 
function createTable(){
    const postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL)";
    db.run(postQuery, function(error){
        if(error){  return console.error(error.message);    }
        else{   console.log("Query Successfully exectued"); }
    })
}
const selectPosts = "SELECT * FROM posts";
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


// SET STORAGE ENGINE 
const storage = multer.diskStorage({
    destination: 'views/images',
    filename: function(req,file, cb){
        cb(null, file.fieldname + '_'+ Date.now()+path.extname(file.originalname));
    }
})
// INIT UPLOAD 
const upload = multer({ storage: storage}).single('img');

/* ===== POST ===== */
app.post('/login', (req, res ) => {
    if(req.body.Username == ADMIN && req.body.Password == PASSWORD){
        req.session.isLoggedIn = true;
        res.redirect('/')
    }else{
        res.redirect('/')
    }
})
app.post('/logOut', (req, res) => {
    if(req.session.isLoggedIn == true){
        req.session.isLoggedIn = false;
        res.redirect('/')
    }else{
        res.redirect('/')
    }
})
app.post('/uploads',(req, res) => {
    upload(req, res, (err) => {
        const title = req.body.title;
        const description = req.body.description;
        const prise = req.body.prise
        const filename = req.file.filename;
        if(!title || !prise || !filename){
            res.redirect("/upload")
            /* Don't forget to fix the errors in the page*/ 
        }else{
            if(err){
                console.log(err)
                res.render('index', {err})
            }else{         
                const insertQuery = "INSERT INTO posts('Title', 'Description', 'Prise', 'Image') VALUES (?,?,?,?)";
                const values =  [title, description, prise,filename]
                db.run(insertQuery,values, function(error){
                    if(error){
                        console.log(error);
                    }
                    else{
                        console.log("File Uploaded Successfully");
                        res.redirect("/");
                    }
                })
            }
        }
    })
})
/* ===== GET ===== */ 
app.get('/', (req, res) => {
    let Inlogged = req.session.isLoggedIn;
    // console.log(selectPosts);
    db.all(selectPosts, [], async(error, data) => {
        if(error){
            console.log(error)
        }
        // let limitData = [];
        /* GEt last 2 elements from the database */
        let last =  function(array, n) {
            if (array == null) 
              return void 0;
            if (n == null) 
               return array[array.length - 1];
            return array.slice(Math.max(array.length - n, 0));  
        };
        let limitData = last(data,2);
        res.render('index.hbs', {data,Inlogged, limitData});      
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
app.get('/posts/:Id', (req, res) => {
    let selectPost ="SELECT * FROM posts WHERE Id = ?";
    let postID = req.params.Id;
    db.all(selectPost, postID, async(error, data) => {
        if(error){
            throw error; 
            // return;
        }
        else{
            console.log(data);
            res.render('post.hbs', {data})
        }
    })
})
app.get('/about', (req, res) => {
    res.render('about.hbs')
})

app.listen(port);



