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
let db = new sqlite3.Database('database3.db');
/* === Admin === */
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'test123';

/* === Limit Function === */
let last =  function(array, n) {
    if (array == null) {return void 0;}
    if (n == null){return array[array.length - 1];}
    return array.slice(Math.max(array.length - n, 0));  
}

/* === DataBase === */ 
function createPostsTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Price NUMBER NOT NULL, Category TEXT NOT NULL,Image TEXT NOT NULL)';
    db.run(Query, function(err){
        if(err){  
            const errMSG = 'Could Not Create The Table';
            return console.error(errMSG);   
        }
        else{   console.log('Query Successfully exectued'); }
    })

}
function createCategoriesTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS categories ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL)';
    db.run(Query, function(err){
        if(err){  
            const errMSG = 'Could Not Create The Table';
            return console.error(errMSG);   
        }
        else{   console.log('Query Successfully exectued'); }
    })

}
function selectQuery(table, id=false){
    return 'SELECT * FROM '+table; 
}

createPostsTable();
createCategoriesTable();
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
   
    if(enteredUsername != ADMIN_USERNAME){
        validationErr.push('Wrong Username');
    }
    if(enteredPassword != ADMIN_PASSWORD){
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
    const errMSG = []
    upload(req, res, (err) => {
        const Title = req.body.title
        const Description = req.body.description
        const Price = parseInt(req.body.price)
        const Category = req.body.category
        const Filename = req.file.filename
        //res.send(Title + ' _ ' + Description + ' _ ' + Price + ' _ ' + Category + ' _ ' + Filename)
        if(errMSG.length == 0){
            if(!Title || !Price || !Filename || !Category){errMSG.push('Fill the required field.')}
            if(typeof Price !== 'number' || Price < 0){ errMSG.push('Price Should Content A  Positiv Number')}
            if(typeof Title !== 'string'){errMSG.push('Title Should Content text, Numbers Only')}
            if(err){errMSG.push('The image has not been uploaded!');}       
            const insertQuery = "INSERT INTO posts('Title', 'Description', 'Price', 'Category','Image') VALUES (?,?,?,?,?)";
            const values =  [Title, Description, Price, Category, Filename]
            db.run(insertQuery,values, function(error){
                if(error){
                    res.send('The post has not been inserted to the database')
                }
                else{
                    console.log('File Uploaded Successfully');
                    res.redirect('/');
                }
            })
        }if(errMSG.length != 0){
            const Query = selectQuery('categories');
            db.all(Query, [], async(error, Category) => {
                if(error){res.send(error)}
                else{
                    const model= {Category, errMSG}
                    // res.send(Category)
                    res.render('upload.hbs', model) 
                }
            })   
        }

    })
})
app.post('/add-category', (req, res) => {
    const enteredName = req.body.name
    const insertQuery = "INSERT INTO categories('Name') VALUES (?)"
    const values = [enteredName];
    const errMSG = []
    if(values.length > 0){
        db.run(insertQuery, enteredName, function(error) {
            if(error){
                //res.send(error)
                res.send('The category has not been inserted to the database')
            }
            else{
                console.log('A New Category has been added to the database');
                res.redirect('/categories');
            }
        })
    }
    else{ 
        errMSG.push('You can not add an empty category')
        const model = {
            errMSG
        }
        res.render('/categories.hbs', model)
    } 

})
app.post('/delete-category', (req, res) => {
    const name = req.body.name
    const deleteQuery = "DELETE FROM categories WHERE Name LIKE ?"
    const values = '%'+name+'%'
    const errMSG = []
    if(values !== ''){
        db.run(deleteQuery, values, function(error) {
            if(error){
                res.send('The '+values.slice('1', '-1')+' category has not been deleted from the database')
            }
            else{
                console.log('The '+values.slice('1', '-1')+' category has been deleted from the database');
                res.redirect('/categories');
            }
        })
    }
    else{ 
        errMSG.push('You can not delete a category with  empty field')
        const model = {
            errMSG
        }
        res.render('/categories.hbs', model)
    } 
})
/* ===== GET ===== */ 
app.get('/', (req, res) => {
    let IndexPage = true;
    const Query = selectQuery('posts');
    db.all(Query, [], async(error, data) => {
        if(error){ res.send(error) }
        else{
            let limitData = last(data,4);
            const model = {
                data, limitData, IndexPage
            }
            res.render('index.hbs', model); 
        }
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
        const Query = selectQuery('categories')
        // console.log(Query);
        db.all(Query, [], async(error, Category) => {
            if(error){res.send(error)}
            else{
                const model= {Category}
                // res.send(Category)
                res.render('upload.hbs', model) 
            }
        })             
    }
    else{   res.redirect('/login')  }
})
app.get('/post/:Id', (req, res) => {
    const id = req.params.Id;
    const Query = 'SELECT * FROM posts WHERE Id = ?'
    const postID = [id]
    // res.send(Query)
    db.get(Query, postID, async(error, content) => {
        if(!error){ 
            const model = {content}
            res.render('post.hbs', model)}
        else{
            res.send(error)
        }
    })
})
app.get('/searching?:search', (req, res) => {
    const Query = 'SELECT * FROM posts WHERE ( Category LIKE ? OR Title LIKE ?) ORDER BY Id'
    const searchingFor = '%'+req.query.search+'%'
    // console.log('Search = '+req.query.search)
    const SearchError = []
    const errMSG = []
    // console.log(searchingFor);
    if(searchingFor !== ''){
        db.all(Query, searchingFor, (error, data)=> {
            if(error){
                res.send('Server error, could not select data from the database')
            }
            if(data.length === 0){
                SearchError.push('There are no content with this Title: '+searchingFor.slice('1','-1')+' OR Category: '+searchingFor.slice('1','-1'))
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
app.get('/about', (req, res) => {
    res.render('about.hbs')
})
app.get('/categories', (req, res) => {
    if(req.session.isLoggedIn ){ 
        // const Query = selectQuery('categories')
        const Query = 'SELECT * FROM categories'
        db.all(Query, [], async(error, data) => {
            if(error){ res.send(error+ 'test') }
            const model = { data}
            // res.send(model)
            res.render('categories.hbs', model)
        })
    }
    else{   res.redirect('/login')}
})
app.get('/edit/:Id', (req, res) => {
    const id = req.params.Id
    const Query = "SELECT * FROM posts WHERE Id = ?;SELECT * FROM categories"
    const value = [id]
    db.all(Query, value, async(error, data) => {
        if(!error){
            const model = {data}
            res.render('/edit.hbs', model)
        }
        else{
            res.send(error);
        }
    })
})
app.listen(port);



