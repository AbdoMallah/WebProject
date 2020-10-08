const bcrypt = require('bcrypt');
const ADMIN_PASSWORD = 'test123'

async function hashIt(password){
    const salt = await bcrypt.genSalt(6);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }
let hashed_PASS = hashIt(ADMIN_PASSWORD)
let hP = hashed_PASS.toString();
async function compareIt(password, hashedPassword){
    const validPassword = await bcrypt.compare(password, hashedPassword);
    return validPassword;
  }
compareIt(ADMIN_PASSWORD, hP);
console.log('ADMIN_PASSWORD: --> '+ADMIN_PASSWORD)
if(compareIt(ADMIN_PASSWORD, hP)){
    console.log('hashed_Pass: --> '+hashed_PASS)
    console.log('hP: -->'+ hP)
}else{
    console.log('Not the same pass')
}