const { query } = require('express');
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('database.db');
const loginDb = new sqlite3.Database('loginDb.db')

loginDb.run(`
    CREATE TABLE IF NOT EXISTS loginTable(
        Id INTEGER PRIMARY KEY AUTOINCREMENT, 
        Username TEXT NOT NULL,
        Password TEXT NOT NULL
    )
`)
db.run(`
    CREATE TABLE IF NOT EXISTS categories (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL
    )`
)
db.run(`
    CREATE TABLE IF NOT EXISTS posts (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT NOT NULL,
        Description TEXT NOT NULL,
        Price REAL NOT NULL,
        CategoryID INTEGER NOT NULL,
        Image TEXT NOT NULL,
        Date TEXT NOT NULL,
        OrderId INTEGER,
        FOREIGN KEY (OrderId) REFERENCES orders(Id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (CategoryID) REFERENCES categories(Id) ON UPDATE CASCADE ON DELETE CASCADE
    )`
)



db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        BuyerName TEXT NOT NULL,
        BuyerEmail TEXT NOT NULL,
        BuyerAddress TEXT NOT NULL,
        BuyerZipCode INTEGER NOT NULL,
        IfSent INTEGER DEFAULT 0
    )`
)

exports.insertintoLogin = function(username ,password, callback){
    const query = "INSERT INTO loginTable ('Username', 'Password') VALUES (? , ?)" 
    const placeHolders = [username, password]  
    loginDb.run(query, placeHolders, function(error){
        callback(error)
    })
}

exports.getLoginInfo = function(callback){
    const query = "SELECT * FROM loginTable WHERE Id = ?"
    const placeHolder = [1]
    loginDb.get(query, placeHolder, function(error, values){
        callback(error, values)
    })

}

function enableForeignKey(){   
    db.run('PRAGMA foreign_keys = ON', function(error){
        if(!error){
            return
        }else{
            console.log('Foreign Key ERROR --> error')
        }
    })
  
}
function disableForeignKey ()
{   
    db.run('PRAGMA foreign_keys = OFF', function(error){
        if(!error){
            return
        }else{
            console.log('Foreign Key ERROR --> error')
        }
    })
}
/* === Exports FUNCTIONs === */
exports.getAllData = function(table,callback){
    enableForeignKey()
    let query = '';
    if(table == 'posts'){
        query = "SELECT * FROM posts"
    }
    if(table == 'categories'){
        query = "SELECT * FROM categories"
    }
    if(table == 'orders'){
        query = "SELECT * FROM orders"
    }
    db.all(query,function(error, values){ 
        callback(error, values)
    })
}
exports.getPostsWithNoOrder = function(callback){
    enableForeignKey()
    const query = 'SELECT * FROM posts WHERE OrderId = ?'
    db.all(query,0,function(error, values){ 
        callback(error, values)
    })

}
exports.filterOrders = function(changeValue,callback){
    enableForeignKey()
    const query = 'SELECT * FROM orders WHERE IfSent = ?'
    db.all(query, changeValue, function(error, values){
        callback(error, values)
    })
}
exports.getDataById = function(table,id, callback){
    enableForeignKey()
    let query = ''
    if(table == 'posts'){
        query = "SELECT * FROM posts WHERE Id = ?"
    }
    if(table == 'categories'){
        query = "SELECT * FROM categories WHERE Id = ?"
    }
    if(table == 'orders'){
        query = "SELECT * FROM orders WHERE Id = ?"
    }
    const placeHolder = [id]
    db.get(query, placeHolder, function(error, values) {
        callback(error, values)
    })
}
exports.deleteDataById = function(table, orderId, id, callback){
    let query = ''
    const placeHolder = []
    const postErrorMSG = []
    if(table == 'posts' && orderId == 0){
        query = 'DELETE FROM  posts WHERE Id = ? AND OrderId = ?'
        placeHolder.push(id, orderId)
    }else if(table == 'posts' && orderId != 0){
        postErrorMSG.push('You can not delete a post that have an order')
    }
    if(table == 'orders'){
        query = 'DELETE FROM  orders WHERE Id = ? AND IfSent = 1'
        placeHolder.push(id)
    }
    db.get(query, placeHolder, function(error,postErrorMSG) {
        callback(error, postErrorMSG)
    })
}
exports.deleteCategoryByName= function(name,callback){
    const query = 'DELETE FROM categories WHERE Name = ?'
    const placeHolder = [name]
    db.run(query, placeHolder, function(error){
        callback(error)
    })
}
exports.updatePost = function(title, description, price, category,id, callback){
    const query = 'UPDATE posts SET Title = ?, Description = ?, Price = ?, CategoryId = ? WHERE Id = ?'
    const updatedValues = [title, description, price, category, id]
    db.run(query, updatedValues, (error)=> {
        callback(error)
    })

}
exports.updatePostOrderIdValue = function(postId, callback){
    // const selectQuery = 'SELECT * FROM orders'
    getAllData('orders', function(error, ordersValue){
        if(!error){
            const query = 'UPDATE posts SET OrderId = ? WHERE Id = ?'
            const placeHolder = [ordersValue.Id, postId]
            db.run(query, placeHolder, function(error, postValues){
                callback(error, postValues)
            })
        }
    })
}
exports.updateOrderIfSentValue = function(id, callback){
    // const changeValue = 1;
    const query= 'UPDATE orders SET IfSent = 1 WHERE Id = ?'
    const placeHolder = [id]
    db.run(query, placeHolder, function(error){
        callback(error)
    })
}
exports.updateCategory = function(name ,id, callback){
    const query = 'UPDATE categories SET Name = ? WHERE Id = ?'
    const placeHolder = [name, id]
    db.run(query, placeHolder, function(error){
        callback(error)
    })
}

exports.createcategory = function(name, callback){
    const query = "INSERT INTO categories('Name') VALUES (?)"
    const placeHolder = [name]
    db.run(query, placeHolder, function(error){
        callback(error)
    })
}

exports.uploadPost = function(Title, Description, Price, CategoryId, Filename, DefaultOrderId,callback){
    const query = "INSERT INTO posts('Title', 'Description', 'Price', 'CategoryId','Image', 'Date', 'OrderId') VALUES (?,?,?,?,?,?,?)"
    const values =  [Title, Description, Price, CategoryId, Filename, Date.now(), DefaultOrderId]
    disableForeignKey();
    db.run(query,values, function(error){
        callback(error)
    })
}
exports.makeOrder = function(postId,buyerName, buyerEmail, buyerAddress, buyerZipCode, callback){
    disableForeignKey();
    const insertQuery = "INSERT INTO orders('BuyerName', 'BuyerEmail', 'BuyerAddress', 'BuyerZipCode', 'IfSent') VALUES (?,?,?,?,?)"
    const defaultValue = 0;
    const values = [buyerName, buyerEmail, buyerAddress, buyerZipCode, defaultValue]
    db.run(insertQuery, values, function(error){
        if(error){ 
            callback(error)
        }else{
            const selectQuery = "SELECT * FROM orders"
            db.get(selectQuery, [], function(error, ordersValue){
                if(error){
                    return
                }else{
                    const updateQuery = 'UPDATE posts SET OrderId = ? WHERE Id = ?'
                    const updatedValues = [ordersValue.Id, postId]
                    db.run(updateQuery, updatedValues, function(error,thxMSG){
                        thxMSG = 'Thx For Choosing PickItNGo. We Will Send An Email With All The Informatiom You Need'
                        callback(error,thxMSG)
                    })
                }
            })
           
        }
        
    })
}
exports.searchFor = function(searchTerm,callback){
    const query = 'SELECT P.*, C.* FROM posts AS P JOIN categories AS C ON P.CategoryId = C.Id WHERE (P.Title LIKE ? OR C.Name LIKE ?) AND P.OrderId LIKE ?'
    const unOrded = 0;
    const placeHolder = [searchTerm, searchTerm, unOrded]
    db.all(query, placeHolder, function(error, values){
        callback(error, values)
    })
}

