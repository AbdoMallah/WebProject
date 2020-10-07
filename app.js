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
const multer = require('multer');
const app = express()
const port = 8000
let db = new sqlite3.Database('database.db');
/* === Admin === */
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'test123';

/* === DataBase === */ 
function createTable(){
    const postQuery = 'CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL)';
    db.run(postQuery, function(err){
        if(err){  
            errMSG.push= 'Could Not Create The Table';
            return console.error(errMSG);   
        }
        else{   console.log('Query Successfully exectued'); }
    })
}
const selectPosts = 'SELECT * FROM posts';
createTable();
/*******************************************************************/

app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs',
    layoutsDir: __dirname + '/views/layouts/'
})) 
app.use(express.static('node_modules/spectre.css/dist'))
app.use(express.static('CSS'))
app.use(express.static('views/images'))
app.use(express.static('views'))
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.urlencoded({extended: true}))

/* === SESSION === */
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'ujniasujnias'
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
app.post('/login', async(req, res ) => {
    const validationErr = [];
    const enteredUsername = req.body.username 
    const enteredPassword = req.body.password  
   
    if(req.body.username != ADMIN_USERNAME){
        validationErr.push('Wrong Username');
    }
    if(req.body.password != ADMIN_PASSWORD){
        validationErr.push('Wrong Password');   
    }
    if(validationErr.length == 0){
        req.session.isLoggedIn = true;
        res.redirect('/')
    }else{
        const model = {validationErr}
        res.render('login.hbs', model)
    }
})
app.post('/logOut', (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/')
})
app.post('/upload',(req, res) => {
    const errMSG = [];
    upload(req, res, (err) => {
        const title = req.body.title;
        const description = req.body.description;
        const prise = parseInt(req.body.prise)
        const filename = req.file.filename;

        if(!title || !prise || !filename){errMSG.push('Fill the required field.')}
        if(typeof prise !== 'number' || prise < 0){ errMSG.push('Prise Should Content A  Positiv Number')}
        if(typeof title !== 'string'){errMSG.push('Title Should Content text, Numbers Only')}
        if(err){errMSG.push('The image has not been uploaded!');}
        if(errMSG.length == 0){         
            const insertQuery = "INSERT INTO posts('Title', 'Description', 'Prise', 'Image') VALUES (?,?,?,?)";
            const values =  [title, description, prise,filename]
            db.run(insertQuery,values, function(error){
                if(error){
                    console.log('The post has not been inserted to the database')
                }
                else{
                    console.log('File Uploaded Successfully');
                    res.redirect('/');
                }
            })
        }
        else{
            const model = {errMSG}
            res.render('upload.hbs', model)
        }

    })
})
app.post('/searching?:search', (req, res) => {
    const Query = 'SELECT * FROM posts WHERE Title LIKE ?'
    const searchingFor = '%'+req.body.search+'%'
    const SearchError = [];
    const errMSG = [];
    // console.log(searchingFor);
    if(searchingFor !== ''){
        db.all(Query, searchingFor, (error, data)=> {
            if(error){
                res.send('Server error, could not select data from the database')
            }
            if(data.length === 0){
                SearchError.push('There is no content with this Title:'+searchingFor.slice('1','-1'))
                const model = {SearchError}
                res.render('searched.hbs', model)
            }else{
                const model = {data}
                res.render('searched.hbs', model)
            }
            
        })
    }else{
        errMSG.push('You can not search with empty field');
        const model = {errMSG}
        res.render('/index.hbs', model)
    }
})
/* ===== GET ===== */ 
app.get('/', (req, res) => {
    let IndexPage = true;
    db.all(selectPosts, [], async(error, data) => {
        if(error){ res.send(error) }
        let last =  function(array, n) {
            if (array == null) 
              return void 0;
            if (n == null) 
               return array[array.length - 1];
            return array.slice(Math.max(array.length - n, 0));  
        };
        let limitData = last(data,4);
        const model = {
            data, limitData, IndexPage
        }
        res.render('index.hbs', model);      
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

app.get('/post/:Id', (req, res) => {
    const id = req.params.Id;
    const Query ="SELECT * FROM posts WHERE Id = ?";
    const postID = [id]
    db.get(Query, postID, (error, content) => {
        if(!error){ 
            const model = {content}
            console.log(content)
            res.render('post.hbs', model)}
        else{
            res.send(error)
        }
    })
})

app.get('/about', (req, res) => {
    res.render('about.hbs')
})
app.listen(port);



