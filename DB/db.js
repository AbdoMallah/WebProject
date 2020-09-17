const sqlite3 = require('sqlite3')
let db = new sqlite3.Database("database.db") 
var postQuery = "CREATE TABLE IF NOT EXISTS posts ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Description TEXT NOT NULL, Prise NUMBER NOT NULL, Image TEXT NOT NULL,  PosterID NUMBER INTEGER , FOREIGN KEY (PosterID) REFERENCES users (Id))";



/* === Create Table if not exist  === */ 
db.run(postQuery, function(error){
    if(error){  return console.error(error.message);    }
    else{   console.log("Query Successfully exectued"); }
})
