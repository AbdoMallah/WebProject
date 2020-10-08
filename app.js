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
const moment = require('moment');
const app = express()
const port = 8000
let db = new sqlite3.Database('database.db');
/* === Admin === */
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'test123';

/* === Functions === */
let last =  function(array, n) {
    if (array == null) {return void 0;}
    if (n == null){return array[array.length - 1];}
    return array.slice(Math.max(array.length - n, 0));  
}
function changeDateFormat(dateInMilliSeconds){
    return moment(dateInMilliSeconds).format('MMMM MM YYYY h:mm:ss');
}


/* === DataBase === */ 
function createPostsTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Price NUMBER NOT NULL, CategoryID INTEGER NOT NULL,Image TEXT NOT NULL, Date TEXT NOT NULL, FOREIGN KEY (CategoryID) REFERENCES categories(Id))';
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
app.use(express.static('views/post'))

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
            const insertQuery = "INSERT INTO posts('Title', 'Description', 'Price', 'CategoryId','Image', 'Date') VALUES (?,?,?,?,?,?)";
            const values =  [Title, Description, Price, Category, Filename, Date.now()]
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
    db.all(Query, [], async(error, selectedPosts) => {
        if(error){ res.send(error) }
        else{
            let limitData = last(selectedPosts,4);
            for(const post of selectedPosts ){
                post.Date = changeDateFormat(parseInt(post.Date))
            }
            const model = {
                selectedPosts, limitData, IndexPage
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
        db.all(Query, [], async(error, Category) => {
            if(error){res.send(error)}
            else{
                const model= {Category}
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
    const selectQuery = 'SELECT P.*, C.* FROM posts AS P JOIN categories AS C ON P.CategoryId = C.Id WHERE P.Title LIKE ? OR C.Name LIKE ?'
    const searchTerm = '%'+req.query.search+'%'
    const placeHolderValues = [
        searchTerm, searchTerm
    ]
    // res.send(selectQuery)
    const SearchError = []  
    const errMSG = []
    if(searchTerm !== ''){
        db.all(selectQuery, placeHolderValues, (error, searchedPost)=> {
            if(error){
                res.send(error + ' Server error, could not select data from the database')
            }
            // res.send(searchedPost)
            if(!searchedPost){
                SearchError.push('There are no content with this Title: '+searchTerm.slice('1','-1')+' OR Category: '+searchTerm.slice('1','-1'))
                const model = {SearchError}
                res.render('searched.hbs', model)
            }else{
                const model = {searchedPost}
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
app.get('/post/edit/:Id', (req, res) => {
    if(req.session.isLoggedIn){
        const id = req.params.Id
        const selectPostQuery = "SELECT * FROM posts WHERE Id = ?"
        const selectCategoriesQuery = "SELECT * FROM categories"
        const value = [id]
        db.get(selectPostQuery, value, async(error, selectedPost) => {
            if(!error){
                db.all(selectCategoriesQuery,[], async(error, selectedCategories) => {
                    if(!error){
                    const model = {selectedPost, selectedCategories}
                    res.render('edit.hbs', model)
                }
                else{
                    res.send('Second Query: '+error)
                }
                })
            }
            else{
                res.send('First Query: '+error)
            }
        })
    }else{res.redirect('/login')}
})
app.listen(port)



