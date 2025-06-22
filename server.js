// 📁 This is the File from where the whole Project Will Start Running
// 📁 Entry Point of the Project

require("dotenv").config(); // Installed Node.js package

// ✅ Trigger scheduled jobs on server start

require("./cron-jobs"); // 👈 This will auto-load index.js by default

// 🔹 Extracting Required Modules to make Our Application
const express = require("express"); // Extract Express Module
const mongoose = require("mongoose"); // Extract Mongoose Module
const {PORT_NUMBER} = require("./configs/server.config");
const app = express(); // App is an Express Function
const {DB_URL} = require("./configs/db.config");
const UserModel = require("./models/user.model"); 
const {expiryTimeOfAccessToken,expiryTimeOfRefreshToken,adminUser} = require("./configs/user-id.config");
const {errorMessage,} = require("./configs/error-handler.configs");
const { logWithTime } = require("./utils/time-stamps.utils");
const {makeTokenWithMongoIDForAdmin} = require("./utils/issue-token.utils");
const { logAuthEvent } = require("./utils/auth-log-utils");

// 🔹 Middleware: Body Parser - THIS MUST BE BEFORE ROUTES
app.use(express.json()); // Converts the JSON Object Requests into JavaScript Object

/*
 * 🔹 And password + random text are encrypted to make password more complicated to crackCreate an Admin User if not Exits at the Start of the Application
*/

// 🔹 And password + random text are encrypted to make password more complicated to crackConnection with MongoDB
mongoose.connect(DB_URL); // Specifying where to connect

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
                const user = await UserModel.create(adminUser);
                logWithTime("👑 Admin User Created Successfully");
                const refreshToken = makeTokenWithMongoIDForAdmin(user,expiryTimeOfRefreshToken);
                if(refreshToken){
                    logWithTime("👑 Welcome Admin, you are successfully logged in!");
                    logWithTime("🔐 Here is your refresh token");
                    user.isVerified = true;
                    user.jwtTokenIssuedAt = Date.now();
                    await user.save();
                    console.log("📦 JWT Refresh Token: ", refreshToken);
                    // Update data into auth.logs
                    await logAuthEvent(req, "REGISTER", { performedOn: user });
                }
                const accessToken = makeTokenWithMongoIDForAdmin(user,expiryTimeOfAccessToken);
                if(accessToken){
                    logWithTime("Use this Access Token for further Actions!");
                    logWithTime("🔐 Here is your access token");
                    console.log("📦 JWT Access Token: ", accessToken);
                    // Update data into auth.logs
                    await logAuthEvent(req, "LOGIN", { performedOn: user });
                }
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
require("./routers/auth.routes")(app)

// 🔹 Initializing Server by Express
app.listen(PORT_NUMBER,()=>{
    // Check Server is Running or not
    logWithTime("🚀 Server has Started at Port Number: "+PORT_NUMBER); 
});