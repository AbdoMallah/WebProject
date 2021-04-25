const express = require('express')
const expresshandlebars = require('express-handlebars') 
const session = require('express-session')
const cookieParser  = require('cookie-parser')
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')  
const path = require('path')
const multer = require('multer')
const moment = require('moment')
const nodemailer = require('nodemailer')
const csrf = require('csurf')
const flash = require('express-flash')
const db = require('./db.js');
const app = express()
const port = 8000
/* === MiddleWares === */
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
    secret: 'ujnersqkbpmas'
}))
app.use(function(req,res,next){
    const isLoggedIn = req.session.isLoggedIn
    res.locals.isLoggedIn = isLoggedIn
    next()
})
/* === Flash === */
app.use(flash())
/*=== CSRF === */
app.use(csrf())
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})


/* === Admin === */
// bcrypt.hash(ADMIN_PASSWORD, salt, function(err, hash){
//     if(!err){
//         db.insertintoLogin('admin', hash, function(error){
//             if(error){
//                 console.log(error)
//             }
//             else{
//                 console.log("test")
//             }
//         })
//     }else{
//         console.log('Error --> ' + err)   
//     }
// })
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

/*******************************************************************/

app.engine('hbs', expresshandlebars({
    defaultLayout: 'main.hbs',
    layoutsDir: __dirname + '/views/layouts/'
})) 



/* === SET STORAGE ENGINE  === */ 

const storage = multer.diskStorage({
    destination: 'views/images',
    filename: function(req,file, cb){
        cb(null, file.fieldname + '_'+ Date.now()+path.extname(file.originalname));
    }
})
/* === INIT UPLOAD === */
const upload = multer({ storage: storage}).single('img');




/* ===== POST ===== */
app.post('/login',(req, res ) => {
    const validationErr = [];
    const enteredUsername = req.body.username 
    const enteredPassword = req.body.password
    const token = req.body.token
    db.getLoginInfo(function(error, values) {
        if(error){
            res.send("Can't get login Info ERROR: --> " + error)
        } else{
            bcrypt.compare(enteredPassword, values.Password, function(error, result){
                if(error){
                    res.sendStatus(401)
                }
                if(enteredUsername != values.Username){
                    validationErr.push('Wrong Username');
                }
                if(!result){
                    validationErr.push('Wrong Password')
                }
                if(validationErr.length == 0){
                    req.session.isLoggedIn = true
                    res.redirect('/')
                }else{
                    const model = {validationErr, token}
                    res.render('login.hbs', model)
                }
            })        
        }
    })
})
app.post('/logOut', (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/index?page=1')
})
app.post('/upload',(req, res) => {
    const errMSG = []
    upload(req, res, (err) => {
        const Title = req.body.title
        const Description = req.body.description
        const Price = parseInt(req.body.price) 
        const CategoryId = req.body.category
        const Filename = req.file.filename
        const DefaultOrderId = 0; 
        if(errMSG.length == 0){
            if(!Title || !Price || !Filename || !CategoryId){errMSG.push('Fill the required field.')}
            if(typeof Price !== 'number' || Price < 0){ errMSG.push('Price Should Content A  Positiv Number')}
            if(typeof Title !== 'string'){errMSG.push('Title Should Content text, Numbers Only')}
            if(err){errMSG.push('The image has not been uploaded!');}       
            db.uploadPost(Title, Description, Price, CategoryId, Filename, DefaultOrderId,function(error){
                if(error){
                    res.send('The post has not been inserted to the database' + error)
                }
                else{
                    console.log('File Uploaded Successfully');
                    res.redirect('/index?page=1');
                }
            })
        }if(errMSG.length != 0){
            db.getAllData('categories', function(error, categoriesValue){
                if(error){res.sendStatus(400)}
                else{
                    const model= {categoriesValue, errMSG}
                    // res.send(Category)
                    res.render('upload.hbs', model) 
                }
            })   
        }
    })
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
        db.updatePost(title, description, price, category, id,function(error){
            if(!error){
                res.redirect('/post/'+id)
            }else{
                res.send(error)
            }

        })
    }
})
app.post('/post/deleteP/:Id', (req, res) => {
    const postId = req.params.Id
    if(req.session.isLoggedIn){
        db.deleteDataById('posts', 0,postId, (error, postErrorMSG) => {
            if(!error){
                console.log('Post With Id: '+ postId +' Has Been Deleted, :D ')
                res.redirect('/index?page=1')
            }else if(postErrorMSG){
                res.send(postErrorMSG)
            }else{
                res.send('Delete ERROR --> ' + error)
            }
        })
    }else{
        res.redirect('/login')
    }
})
app.post('/add-category', (req, res) => {
    const enteredName = req.body.name
    const Value = [enteredName]
    const errMSG = []
    if(req.session.isLoggedIn){
        if(Value != 0){
            db.createcategory(enteredName, function(error){
                if(error){
                    errMSG.push('The category has not been inserted to the database')
                }
                else{
                    console.log('A New Category has been added to the database')
                }
            })    
        }else{ 
            errMSG.push('You can not add an empty category')
        }
        if(errMSG.length == 0){
            req.flash('cMSG', 'A category has been added')
            res.redirect('/categories')
        }else{
            const model = {
                errMSG
            }
            res.render('categories.hbs', model)
        }
    }else{
        res.redirect('/login')
    }
})
app.post('/editC/categoryId=:Id', (req, res) => {
    const id = req.params.Id
    const name = req.body.name
    const emptyFieldError = [];
    if(req.session.isLoggedIn){
        if(!name ){
            emptyFieldError.push('You can not update category name with empty fields')
        }
        else{
            
            db.updateCategory(name,id,function(error){
                if(!error){
                    // console.log(updatedValues)
                    res.redirect('/categories')
                }else{
                    res.send(error)
                }
            })
        }
    }else{
        res.redirect('login')
    }
})
app.post('/deleteC', (req, res) => {
    const cName = req.body.name
    const errMSG = []
    if(req.session.isLoggedIn){
        if(cName){
            db.deleteCategoryByName(cName, function(error) {
                if(error){
                    res.send('The category with Name: '+cName+' has not been deleted from the database')
                }
                else{
                    console.log('The category with Name: '+cName+' has been deleted from the database');     
                }
            })
        }
        else{ 
            errMSG.push('You can not delete a category with empty field')
        } 
        if(errMSG.length == 0){
            req.flash('cMSG', 'A category has been deleted')
            res.redirect('/categories');
        }else{
            const model = {errMSG}
            res.render('/categories.hbs', model)

        }
    }else{
        res.redirect('login')
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
            // console.log('Email sent: ' + info.response);
                thxMSG.push('Thx For sending your Question, I will try to answer as fast as I can :D')
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
    const postId= req.params.Id
    const buyerName = req.body.name
    const buyerEmail = req.body.email
    const buyerAddress = req.body.address
    const buyerZipCode = req.body.zipCode
    const errMSG = []
    if(!buyerName|| !buyerEmail|| !buyerAddress || !buyerZipCode){
        errMSG.push('You can buy without filling the fields')
        const model = {errMSG}
        res.render('buy.hbs/'+postId, model)
    }else{
        db.makeOrder(postId,buyerName, buyerEmail, buyerAddress, buyerZipCode,function(error, thxMSG){
            if(error){
                res.send('We have an error to complete your order, plz try again later')
            }else{
                const model = {thxMSG}
                res.render('thxMessage.hbs', model)
            }
        })
    }
})
app.post('/filter-order', (req, res) => {
    const ifSent = req.body.sent
    const changeSentValue = []
    if(req.session.isLoggedIn){
        if(ifSent == 'sent'){
            changeSentValue.push(1)
        }
        if(ifSent == 'unsent') {
            changeSentValue.push(0)
        }
        if(ifSent == 'showAll'){
            res.redirect('/orders')
        }
        db.filterOrders(changeSentValue, (error, ordersValue) => {
            if(!error){
                const model = {ordersValue}
                res.render('orders.hbs', model)
            }else{
                res.send('Can not get order Value, ERROR --> '+ error)
            }
        })
    }
})

app.post('/deleteOrder/:Id', (req, res) => {
    const id = req.params.Id
    if(req.session.isLoggedIn){
        db.deleteDataById('orders',1,id,function(error){
            if(!error){
                req.flash('oMSG', 'An order has been deleted')
                res.redirect('/orders')
            }else{
                res.send('Order with id = ' + id + ' has not been deleted , ERROR --> ' + error)
            }
        })
    }else{
        res.redirect('/login')
    }
})
app.post('/sendOrder/:Id', (req, res) => {
    const id = req.params.Id
    if(req.session.isLoggedIn){
        db.updateOrderIfSentValue(id, function(error){
            if(!error){
                req.flash('oMSG', 'An order has been send')
                res.redirect('/orders')
            }else{
                res.send('Database table orders has not been updated, ERROR --> ' + error)
            }
        })
    }else{
        res.redirect('/login')
    }
    
})
/* ===== GET ===== */
app.get('/', (req, res) => {
    res.redirect('/index?page=1')
}) 
app.get('/index',(req, res) => {
    let showSearchBar = true;
    let IndexPage = true
    const page = parseInt(req.query.page)
    const limit =12;
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
    const amountPages = []
  
    db.getPostsWithNoOrder(function(error, selectedPosts){
        if(error){ res.send('ERROR ---> ' + error) }
        else{
            if(selectedPosts.length > limit){
                for(let i =1; i < ((selectedPosts.length * 2 ) / limit); i++){
                    amountPages.push(i)
                }
                if(endIndex < selectedPosts.length){
                    results.next = {
                        page: page +1,
                        limit: limit
                    }
                }
                if(startIndex > 0){
                    results.previous = {
                        page: page  - 1,
                        limit: limit
                    }
                }
            }
            let nextPage = results.next
            let prevPage = results.previous
            let limitData = last(selectedPosts,4);
            for(const post of selectedPosts ){
                post.Date = changeDateFormat(parseInt(post.Date))
            }
            results.postsResults = selectedPosts.slice(startIndex, endIndex)
            const model = {
                results, limitData, IndexPage,showSearchBar, nextPage, prevPage, amountPages
            }
            // res.send(values)
            // console.log(amountPages)
            res.render('index.hbs', model); 
        }
    })
})
app.get('/login', (req, res) => {
    if(req.session.isLoggedIn == true){
        res.redirect('/index?page=1')
    }else{
        const token = Math.random()
        res.render('login.hbs', {token})
     }
})
app.get('/contact', (req, res) => {
    res.render('contact.hbs')
})
app.get('/upload', (req, res) => {
    if(req.session.isLoggedIn ){
        const token = Math.random()
        db.getAllData('categories', function(error, categoriesValue){
            if(error){res.send(error)}
            else{
                const model= {categoriesValue, token}
                res.render('upload.hbs', model) 
            }
        })             
    }
    else{   res.redirect('/login')  }
})
app.get('/post/:Id', (req, res) => {
    const id = req.params.Id;
    const token = Math.random()
    db.getDataById('posts',id,function(error, postContent){
        if(!error){
            const model = {postContent, token}
            res.render('post.hbs', model)}
        else{
            res.send("selectPostByID-ERROR -->  " + error)
        }
    })
})
app.get('/post/editP/:Id', (req, res) => {
    if(req.session.isLoggedIn){
        const id = req.params.Id
        const token = Math.random()
        db.getDataById('posts', id,function(error, selectedPost){
            if(error){ res.send('getPostById-ERROR ---> ' + error) }
            else{
                db.getAllData('categories',function(error, selectedCategories) {
                    if(!error){
                    const model = {selectedPost, selectedCategories, token}
                    res.render('editP.hbs', model)
                    }
                    else{
                        res.send('Second Query: '+error)
                    }
                })
            }
        })
    }else{res.redirect('/login')}
})

app.get('/searching?:search', (req, res) => {
    const searchTerm = '%'+req.query.search+'%' 
    let showSearchBar =true; 
    const amountPosts = []; 
    const SearchError = []  
    const errMSG = []
    const clearedSeachTerm =  searchTerm.charAt(1).toUpperCase() + searchTerm.slice('2', '-1')
    if(searchTerm !== ''){
        db.searchFor(searchTerm,function(error, searchedPost){
            if(error){
                res.send(error + ' Server error, could not select data from the database')
            }
            if(searchedPost.length == 0){
                SearchError.push('There are no content with this Title: '+clearedSeachTerm+' OR Category: '+clearedSeachTerm)
                const model = {SearchError, showSearchBar}
                res.render('searched.hbs', model)
            }else{
                amountPosts.push((searchedPost.length))
                const model = {searchedPost, showSearchBar, amountPosts, clearedSeachTerm}
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
    const token = Math.random()
    if(req.session.isLoggedIn ){ 
        db.getAllData('categories',function(error, selectedCategories) {
            if(error){ res.send(error+ 'test') }
            const model = { selectedCategories, token}
            res.render('categories.hbs', model)
        })
    }
    else{   res.redirect('/login')}
})
app.get('/categories/editC/:Id', (req, res) => {
    if(req.session.isLoggedIn){
        const id = req.params.Id
        const token = Math.random()
        const value = [id]
        db.getDataById('categories',value, (error, selectedCategory) => {
            if(!error){
                const model = {selectedCategory, token}
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
app.get('/order/:Id', (req, res) => {
    const postId = req.params.Id
    db.getDataById('posts', postId, function(error, selectedPost){
        if(!error){
            const model = {selectedPost} 
            res.render('buy.hbs', model)
        }else(
            res.send(error)
        )
    })
    
})
app.get('/orders', (req, res) => {
    if(req.session.isLoggedIn){
        db.getAllData('orders',function(error, ordersValue){
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
app.listen(port)

/* Before Pagination */
// app.get('/index',(req, res) => {
//     let IndexPage = true;
//     db.getPostsWithNoOrder(function(error, selectedPosts){
//         if(error){ res.send('ERROR ---> ' + error) }
//         else{
//             // paginatedResults(selectedPosts)
//             let limitData = last(selectedPosts,4);
//             for(const post of selectedPosts ){
//                 post.Date = changeDateFormat(parseInt(post.Date))
//             }
//             const model = {
//                 selectedPosts, limitData, IndexPage
//             }
//             // res.send(values)
//             res.render('index.hbs', model); 
//         }
//     })
// })