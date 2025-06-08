// 📁 This is the File from where the whole Project Will Start Running
// 📁 Entry Point of the Project

// 🔹 Extracting Required Modules to make Our Application
const express = require("express"); // Extract Express Module
const mongoose = require("mongoose"); // Extract Mongoose Module
const serverConfigs = require("./Configs/server.config");
const app = express(); // App is an Express Function
const dbConfigs = require("./Configs/db.config");
const UserModel = require("./Models/User.model"); 
const userID_Model = require("./Configs/userID.config");
const functionModel = require("./Configs/message.configs");
const errorMessage = functionModel.errorMessage;
const commonFeatures = require("./Configs/commonFeatures.config");
const logWithTime = commonFeatures.logWithTime;

// 🔹 Middleware: Body Parser - THIS MUST BE BEFORE ROUTES
app.use(express.json()); // Converts the JSON Object Requests into JavaScript Object

/*
 * 🔹 And password + random text are encrypted to make password more complicated to crackCreate an Admin User if not Exits at the Start of the Application
*/

// 🔹 And password + random text are encrypted to make password more complicated to crackConnection with MongoDB
mongoose.connect(dbConfigs.DB_URL); // Specifying where to connect

const db = mongoose.connection; // Ordering to Connect

// 🔹 And password + random text are encrypted to make password more complicated to crackIf MongoDB is not connected 
db.on("error",(err)=>{
    logWithTime("⚠️ Error Occured while Connecting to Database");
    errorMessage(err);
    return;
})

// 🔹 And password + random text are encrypted to make password more complicated to crackIf MongoDB is connected successfully
db.once("open",()=>{
    logWithTime("✅ Connection estabalished with MongoDB Succesfully");
    init();
})

// 🔹 We are keeping One Admin User for each Local Machine
async function init(){ // To use await we need to make function Asynchronous
    try{
        let user = await UserModel.findOne({userType: "Admin"}); // Finding the User who is Admin
        if(user){ // Means the Admin User Exists
            logWithTime("🟢 Admin User already exists");
        }
        else{ // Since findOne returns null when no user found this statement will execute if no Admin User exists
            try{
                const user = await UserModel.create(userID_Model.adminUser);
                logWithTime("👑 Admin User Created Successfully");
                logWithTime("Admin User details are given below:- ");
                console.log(user);
            }catch(err){
                logWithTime("⚠️ Error Occured while Creating an Admin User");
                errorMessage(err);
                return;
            }
        }
    }catch(err){
        logWithTime("⚠️ Error Occured while Reading the Database");
        errorMessage(err);
        return;
    }
}

// 🔹 Connect Server to the Router
require("./Routers/auth.routes")(app)

// 🔹 Initializing Server by Express
app.listen(serverConfigs.PORT_NUMBER,()=>{
    // Check Server is Running or not
    logWithTime("🚀 Server has Started at Port Number: "+serverConfigs.PORT_NUMBER); 
});