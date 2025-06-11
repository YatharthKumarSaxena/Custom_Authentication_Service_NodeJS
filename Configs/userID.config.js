const bcryptjs = require("bcryptjs");
const idPrefixes = require("./idPrefixes.config").admin
const IP_Address_Code = require("./ipAddress.config").IP_Address_Code
const adminUserID = 100000;
const adminID = idPrefixes + IP_Address_Code + String(adminUserID);
const SALT = 8 // For Encryption 8 is used as by default SALT
module.exports = {
    userRegistrationCapacity: 100000, // This Monolithic Machine can handle 1 Lakh User Data
    adminUserID:adminUserID,
    adminID: adminID, // Admin userID
    IP_Address_Code: IP_Address_Code, // Unique per machine
    SALT: SALT,
    secretCode: "This is secret code for JSON Web Token",
    expiryTimeOfJWTtoken: 480, // JWT Token will expire after 120 Seconds
    adminUser:{
        name: "Yatharth",
        phoneNumber: "7310871289",
        // Password is Encypted to make the Password more complicated to crack
        // When Someone by Chance get access to Database if password is stored in Encrypted format
        // It makes it complicated to decode and hence it increases the security of User Data Privacy
        // There are so many methods for Hashing , in this project I used SALT Based Hashing
        // SALT is bascially a Random Text (Can be String or Number) is added to password
        password: bcryptjs.hashSync("yatharth@123",SALT),
        emailID: "yatharthsaxena5667@gmail.com",
        address: [
            {localAddress: "Sasni Gate",
            city: "Aligarh",
            pincode: "202001",
            state: "Uttar Pradesh",
            country: "India"}
        ],
        userType: "Admin",
        userID: adminID
    }
}