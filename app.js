const express = require('express') //TO USE express frameWork
const expresshandlebars = require('express-handlebars') //To Use to handlebars in express
const session = require('express-session')
const cookieParser  = require('cookie-parser')
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt') //uses to hash password, don't need it in is Projekt. 
const fs = require('fs')
const path = require('path')
const multer = require('multer');
const moment = require('moment');
const nodemailer = require('nodemailer');
const { send } = require('process');

const app = express()
const port = 8000
let db = new sqlite3.Database('database.db');
/* === Admin === */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'test123';

async function hashIt(password){
    const salt = await bcrypt.genSalt(6);
    const hashed = await bcrypt.hash(password, salt);
  }
let hashed_PASS = hashIt(ADMIN_PASSWORD)
let hashPass = hashed_PASS.toString();
async function compareIt(password, hashedPassword){
    const validPassword = await bcrypt.compare(password, hashedPassword);
}
/* === Functions === */
let last =  function(array, n) {
    if (array == null) {return void 0;}
    if (n == null){return array[array.length - 1];}
    return array.slice(Math.max(array.length - n, 0));  
}
function changeDateFormat(dateInMilliSeconds){
    return moment(dateInMilliSeconds).format('MMMM MM YYYY h:mm:ss');
}

/* === Send Mail === */
let transporter = nodemailer.createTransport({
    
    service: 'gmail',
    auth: {
      user: "pickitngo@gmail.com",
      pass: "8w9s23X6aHMI"
    }
  });

/* === DataBase === */ 
function enableForeignKey()
{   
    const Query = 'PRAGMA foreign_keys = ON'
    db.run(Query, [], async(error) => {
        if(error){
            console.log('Foreign Key ERROR --> ' + error )
        }else {
            console.log('Query Successfully exectued')
        }
    })
}
function DisableForeignKey()
{   
    const Query = 'PRAGMA foreign_keys = OFF'
    db.run(Query, [], async(error) => {
        if(error){
            console.log('Foreign Key ERROR --> ' + error )
        }else {
            console.log('Query Successfully exectued')
        }
    })
}

function createPostsTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Price REAL NOT NULL, CategoryID INTEGER NOT NULL, Image TEXT NOT NULL, Date TEXT NOT NULL, OrderId INTEGER NOT NULL, FOREIGN KEY (OrderId) REFERENCES orders(Id) ON UPDATE CASCADE ON DELETE CASCADE,FOREIGN KEY (CategoryID) REFERENCES categories(Id) ON UPDATE CASCADE ON DELETE CASCADE)';
    db.run(Query, function(err){
        if(err){  
            const errMSG = 'Could Not Create The Posts Table';
            return console.error(errMSG + '/n' + err);   
        }
        else{   console.log('Query Successfully exectued'); }
    })

}
function createCategoriesTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS categories ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL)';
    db.run(Query, function(err){
        if(err){  
            const errMSG = 'Could Not Create The Category Table';
            return console.error(errMSG + '/n' + err);   
        }
        else{   console.log('Query Successfully exectued'); }
    })

}
function createOrderTable(){
    const Query = 'CREATE TABLE IF NOT EXISTS orders (Id INTEGER PRIMARY KEY AUTOINCREMENT,BuyerName TEXT NOT NULL, BuyerEmail TEXT NOT NULL, BuyerAddress TEXT NOT NULL, BuyerZipCode INTEGER NOT NULL,IfSend INTEGER DEFAULT 0)';
    db.run(Query, function(err){
        if(err){  
            const errMSG = 'Could Not Create The Order Table';
            return console.error(errMSG + ' ' + err);   
        }
        else{   console.log('Query Successfully exectued'); }
    })

}
function selectQuery(table){
    enableForeignKey();
    return 'SELECT * FROM '+table;
}
createOrderTable()
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
    if(enteredPassword.length < 6){
        validationErr.push('To short password')
    }
    if(enteredUsername != ADMIN_USERNAME){
        validationErr.push('Wrong Username');
    }
    if(enteredPassword != ADMIN_PASSWORD){
        validationErr.push('Wrong Password');   
    }
    if(validationErr.length == 0){
        if(compareIt(ADMIN_PASSWORD, hashPass)){
            req.session.isLoggedIn = true;
            res.redirect('/')
        }else{
            console.log("The server could not compare the password with the hashed Password")
        }
        
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
    DisableForeignKey();
    upload(req, res, (err) => {
        const Title = req.body.title
        const Description = req.body.description
        const Price = parseInt(req.body.price)
        const Category = req.body.category
        const Filename = req.file.filename
        const DefaultOrderId = 0;
        if(errMSG.length == 0){
            if(!Title || !Price || !Filename || !Category){errMSG.push('Fill the required field.')}
            if(typeof Price !== 'number' || Price < 0){ errMSG.push('Price Should Content A  Positiv Number')}
            if(typeof Title !== 'string'){errMSG.push('Title Should Content text, Numbers Only')}
            if(err){errMSG.push('The image has not been uploaded!');}       
            const insertQuery = "INSERT INTO posts('Title', 'Description', 'Price', 'CategoryId','Image', 'Date', 'OrderId') VALUES (?,?,?,?,?,?,?)";
            const values =  [Title, Description, Price, Category, Filename, Date.now(), DefaultOrderId]
            db.run(insertQuery,values,(error) => {
                if(error){
                    res.send('The post has not been inserted to the database' + error)
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
    const select = selectQuery('categories')
    const Values = [enteredName]
    const errMSG = []
    if(Values.length != 0){
        db.run(insertQuery, Values, (error) =>{
            if(error){
                res.send('The category has not been inserted to the database')
            }
            else{
                console.log('A New Category has been added to the database')
            }
        })    
    }else{ 
        errMSG.push('You can not add an empty category')
    }
    if(errMSG.length == 0){
        res.redirect('/categories')
    }else{
        const model = {
            errMSG
        }
        res.render('categories.hbs', model)
    }
})
app.post('/delete-category', (req, res) => {
    enableForeignKey();
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
                
            }
        })
    }
    else{ 
        errMSG.push('You can not delete a category with empty field')
    } 
    if(errMSG.length == 0){
        res.redirect('/categories');
    }else{
        const model = {errMSG}
        res.render('/categories.hbs', model)

    }
})
app.post('/editP/post=:Id', (req, res) => {
    const id = req.params.Id
    const title = req.body.title
    const description = req.body.description
    const price = req.body.price
    const category = req.body.category
    const emptyFieldError = [];
    if(!title || !description || !price || !category){
        emptyFieldError.push('You can not update a post with empty fields')
    }
    else{
        const updateQuery = 'UPDATE posts SET Title = ?, Description = ?, Price = ?, CategoryId = ? WHERE Id = ?'
        const updatedValues = [title, description, price, category, id]
        db.run(updateQuery, updatedValues, async(error)=> {
            if(!error){
                res.redirect('/post/'+id)
            }else{
                res.send(error)
            }

        })
    }
})
app.post('/editC/categoryId=:Id', (req, res) => {
    const id = req.params.Id
    const name = req.body.name
    const emptyFieldError = [];
    if(!name ){
        emptyFieldError.push('You can not update category name with empty fields')
    }
    else{
        const updateQuery = 'UPDATE categories SET Name = ? WHERE Id = ?'
        const updatedValues = [name, id]
        db.run(updateQuery, updatedValues, async(error)=> {
            if(!error){
                // console.log(updatedValues)
                res.redirect('/categories')
            }else{
                res.send(error)
            }
        })
    }
})
app.post('/contact', (req, res) => {
    const senderEmail = req.body.email
    const subject = req.body.subject
    const msgContent = req.body.msgContent
    const emptyFieldError = []; 
    const thxMSG = []
    if(senderEmail && subject && msgContent){
        let mailOptions = {
            from: ''+senderEmail+'',
            to: 'pickitngo@gmail.com',
            subject: ''+subject+'',
            text: ''+msgContent+''
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
            console.log(error);
            } else {
            console.log('Email sent: ' + info.response);
            thxMSG('Thx For sending your Question, I will try to answer as fast as I can :D')
            const model = {thxMSG}
            res.render('thxMessage.hbs', model)
            }
        });
    }else{
        emptyFieldError.push('You can not send email with empty fields')
        const model = {
            emptyFieldError
        }
        res.render('contact.hbs', model)
    }
})
app.post('/order/post=:Id', (req, res) => {
    DisableForeignKey();
    //enableForeignKey();
    const postId= req.params.Id
    const buyerName = req.body.name
    const buyerEmail = req.body.email
    const buyerAddress = req.body.address
    const buyerZipCode = req.body.zipCode
    const defaultValue = 0;
    const insertQuery = "INSERT INTO orders('BuyerName', 'BuyerEmail', 'BuyerAddress', 'BuyerZipCode', 'IfSend') VALUES (?,?,?,?,?)"
    const errMSG = []
    const thxMSG = []
    if(!buyerName|| !buyerEmail||!buyerAddress || !buyerZipCode){
        errMSG.push('You can buy without filling the fields')
        const model = {errMSG}
        res.render('buy.hbs/'+postId, model)
    }else{
        const insertedValues = [buyerName, buyerEmail, buyerAddress, buyerZipCode, defaultValue]
        db.run(insertQuery, insertedValues, (error) => {
            if(!error){
                const selectOrderID = selectQuery('orders')
                db.get(selectOrderID, [], async(error, ordersValue) => {
                    if(!error){
                        const updatePostOrderID = 'UPDATE posts SET OrderId = ? WHERE Id = ?'
                        const updatedValues = [ordersValue.Id, postId]
                        //  console.log(ordersValue.Id + ' || ' + postId)
                        db.run(updatePostOrderID, updatedValues, (error) => {
                            if(!error){
                                thxMSG.push('Thx For choosing pickItNGo, We will send you an email with all the information you need :D')
                                const model = {thxMSG}
                                res.render('thxMessage.hbs', model)
                            }else{
                                res.send('Update Error --> ' + error)
                            }
                        })
                    }else{
                        res.send('Select Error --> ' + error)
                    }
                })
            }else{
                res.send('We have an error to complete your order, try to refresh the site or try agian later Thx :D ')
            }
        })
    }
})
app.post('/send/OrderId=:Id', (req, res) => {
    const id = req.params.Id
    const updateIfSendColumn = 'UPDATE orders SET IfSend = ? WHERE Id = ?'
    const sentValue = 1
    const updatedValues = [ sentValue,id]
    db.run(updateIfSendColumn, updatedValues, async(error) => {
        if(!error){
            //console.log(updatedValues)
            res.redirect('/orders')
        }else{
            res.send('Database table orders has not been updated, ERROR --> ' + error)
        }
    }) 
})  
app.post('/filter-order', (req, res) => {
    const ifSent = req.body.sent
    const changeSentValue = []
    if(ifSent == 'sent'){
        changeSentValue.push(1)
    }
    if(ifSent == 'unsent') {
        changeSentValue.push(0)
    }
    if(ifSent == 'showAll'){
        res.redirect('/orders')
    }
    ordersData = 'SELECT * FROM orders WHERE IfSend = ?'
    db.all(ordersData, changeSentValue, async(error, ordersValue) => {
        if(!error){
            const model = {ordersValue}
            res.render('orders.hbs', model)
        }else{
            res.send('Can not get order Value, ERROR --> '+ error)
        }
    })
})
/* ===== GET ===== */ 
app.get('/', (req, res) => {
    let IndexPage = true;
    enableForeignKey();
    const Query = 'SELECT * FROM posts WHERE OrderId = 0';
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
    const selectQuery = 'SELECT P.*, C.* FROM posts AS P JOIN categories AS C ON P.CategoryId = C.Id WHERE (P.Title LIKE ? OR C.Name LIKE ?) AND P.OrderId LIKE ?'
    const searchTerm = '%'+req.query.search+'%'
    const unOrded = 0;
    const placeHolderValues = [
        searchTerm, searchTerm, unOrded
    ]
    const SearchError = []  
    const errMSG = []
    if(searchTerm !== ''){
        db.all(selectQuery, placeHolderValues, (error, searchedPost)=> {
            if(error){
                res.send(error + ' Server error, could not select data from the database')
            }
            if(searchedPost.length == 0){
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
        const Query = selectQuery('categories')
        db.all(Query, [], async(error, data) => {
            if(error){ res.send(error+ 'test') }
            const model = { data}
            // res.send(model)
            res.render('categories.hbs', model)
        })
    }
    else{   res.redirect('/login')}
})
app.get('/post/editP/:Id', (req, res) => {
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
                    res.render('editP.hbs', model)
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
app.get('/post/deleteP/:Id', (req, res) => {
    const postId = req.params.Id
    const deleteQuery = 'DELETE FROM posts WHERE Id = ?, OrderID = ?'
    const values = [postId, 0] 
    db.run(deleteQuery, values, (error) => {
        if(!error){
            console.log('Post With Id: '+ postId +' Has Been Deleted, :D ')
            res.redirect('/')
        }else{
            res.send('Delete ERROR --> ' + error)
        }
    })
})
app.get('/categories/editC/:Id', (req, res) => {
    if(req.session.isLoggedIn){
        const id = req.params.Id
        const selectCategoryQuery = "SELECT * FROM categories WHERE Id = ?"
        const value = [id]
        // console.log('id --> '+ id)
        db.get(selectCategoryQuery, value, async(error, selectedCategory) => {
            if(!error){
                const model = {selectedCategory}
                // res.send('Hi')
                // console.log('model --> ' + model)
                res.render('editC.hbs', model)
            }
            else{
                res.send(error)
            }
        })
    }else{res.redirect('/login')}
})
app.get('/thxMessage', (req, res) => {
    res.render('thxMessage.hbs')
})
app.get('/buy/:Id', (req, res) => {
    const postId = req.params.Id
    const selectPostById = 'SELECT * FROM posts WHERE Id = ?' 
    const values = [postId]
    db.get(selectPostById, values, async(error, selectedPost)=> {
        if(!error){
            const model = {selectedPost} 
            console.log(model)

            res.render('buy.hbs', model)
        }else(
            res.send(error)
        )
    })
    
})
app.get('/orders', (req, res) => {
    if(req.session.isLoggedIn){
        ordersData = selectQuery('orders')
        db.all(ordersData, [], async(error, ordersValue) => {
            if(!error){
                const model = {ordersValue}
                res.render('orders.hbs', model)
            }else{
                res.send('Can not get order Value, ERROR --> '+ error)
            }
        })
    }else{
        res.redirect('/login')
    }
})
app.get('/send/OrderId=:Id', (req, res) => {
    const id = req.params.Id
    const updateIfSendColumn = 'UPDATE orders SET IfSend = ? WHERE Id = ?'
    const sentValue = 1
    const updatedValues = [ sentValue,id]
    db.run(updateIfSendColumn, updatedValues, async(error) => {
        if(!error){
            //console.log(updatedValues)
            res.redirect('/orders')
        }else{
            res.send('Database table orders has not been updated, ERROR --> ' + error)
        }
    }) 
}) 
app.get('/delete/OrderId=:Id', (req, res) => {
    const id = req.params.Id
    const updateIfSendColumn = 'DELETE FROM  orders WHERE Id = ?'
    db.run(updateIfSendColumn, id, async(error) => {
        if(!error){
            //console.log(updatedValues)
            res.redirect('/orders')
        }else{
            res.send('Order with id = ' + id + ' has not been deleted , ERROR --> ' + error)
        }
    }) 
})  


app.listen(port)



