const sqlite3 = require('sqlite3')
let db = new sqlite3.Database("database .db") //Test 1
var userQuery = "CREATE TABLE IF NOT EXISTS users ( Id INTEGER PRIMARY KEY AUTOINCREMENT, FirstName TEXT NOT NULL, LastName TEXT NOT NULL, Email TEXT NOT NULL UNIQUE, Password TEXT NOT NULL, PhoneNumber NUMBER NOT NULL UNIQUE)"
var postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL,  PosterID NUMBER INTEGER , FOREIGN KEY (PosterID) REFERENCES users (Id))";


/* === Test 1 === */ 
db.run(userQuery, function(error){
    if(error){  return console.error(error.message);    }
    else{   console.log("Query Successfully exectued"); }
})
// db.run(postQuery)