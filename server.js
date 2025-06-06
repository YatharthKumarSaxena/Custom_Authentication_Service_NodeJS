// This is the File from where the whole Project Will Start Running

// Extracting Required Modules to make Our Application
const express = require("express"); // Extract Express Module
const mongoose = require("mongoose"); // Extract Mongoose Module
const serverConfigs = require("./Configs/server.config");
const app = express(); // App is an Express Function
const dbConfigs = require("./Configs/db.config");
const UserModel = require("./Models/User.model");
// There are so many methods for Hashing , in this project I used SALT Based Hashing
const bcryptjs = require("bcryptjs"); // SALT is bascially a Random Text (Can be String or Number) is added to password 
// And password + random text are encrypted to make password more complicated to crack
const userID_Model = require("./Configs/userID.config");
const functionModel = require("./Configs/message.configs");
const errorMessage = functionModel.errorMessage;

/*
 * Create an Admin User if not Exits at the Start of the Application
*/

// Connection with MongoDB
mongoose.connect(dbConfigs.DB_URL); // Specifying where to connect

const db = mongoose.connection; // Ordering to Connect

// If MongoDB is not connected 
db.on("error",(err)=>{
    console.log("Error Occured while Connecting to Database");
    errorMessage(err);
    return;
})

// If MongoDB is connected successfully
db.once("open",()=>{
    console.log("Connection estabalished with MongoDB Succesfully");
    init();
})

// We are keeping One Admin User for each Local Machine
async function init(){ // To use await we need to make function Asynchronous
    try{
        let user = await UserModel.findOne({userType: "Admin"}); // Finding the User who is Admin
        if(user){ // Means the Admin User Exists
            console.log("Admin User already exists");
        }
        else{ // Since findOne returns null when no user found this statement will execute if no Admin User exists
            try{
                const user = await UserModel.create(userID_Model.adminUser)
                console.log("Admin User Created Successfully");
                console.log("Admin User details are given below:- ");
                console.log(user);
            }catch(err){
                console.log("Error Occured while Creating an Admin User");
                errorMessage(err);
                return;
            }
        }
    }catch(err){
        console.log("Error Occured while Reading the Database");
        errorMessage(err);
        return;
    }
}

// Connect Server to the Router
require("./Routers/auth.routes")(app)

// Converts the JSON Object Requests into JavaScript Object
app.use(express.json());

// Initializing Server by Express
app.listen(serverConfigs.PORT_NUMBER,()=>{
    // Check Server is Running or not
    console.log("Server has Started at Port Number: "+serverConfigs.PORT_NUMBER); 
});