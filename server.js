// This is the File from where the whole Project Will Start Running

// Extracting Required Modules to make Our Application
const express = require("express"); // Extract Express Module
const mongoose = require("mongoose"); // Extract Mongoose Module
const serverConfigs = require("./Configs/server.config");
const app = express(); // App is an Express Function
const dbConfigs = require("./Configs/db.config");
const UserModel = require("./Models/User.model");
const bcryptjs = require("bcryptjs");
const userID_Model = require("./Configs/userID.config");

/*
 * Create an Admin User if not Exits at the Start of the Application
*/

// Connection with MongoDB
mongoose.connect(dbConfigs.DB_URL); // Specifying where to connect

const db = mongoose.connection; // Ordering to Connect

// If MongoDB is not connected 
db.on("err",()=>{
    console.log("Error Occured while Connecting to Database");
    console.log("Error Occured is displayed below:- ");
    console.log(err);
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
                const user = await UserModel.create({
                name: "Yatharth",
                phoneNumber: "7310871289",
                // Password is Encypted to make the Password more complicated to crack
                // When Someone by Chance get access to Database if password is stored in Encrypted format
                // It makes it complicated to decode and hence it increases the security of User Data Privacy
                password: bcryptjs.hashSync("yatharth@123",8),
                emailID: "yatharthsaxena5667@gmail.com",
                address: [
                            {localAddress: "Sasni Gate",
                            city: "Aligarh",
                            pincode: "202001",
                            state: "Uttar Pradesh",
                            country: "India"}
                ],
                userType: "Admin",
                userID: userID_Model.adminID
                })
                console.log("Admin User Created Successfully");
                console.log("Admin User details are given below:- ");
                console.log(user);
            }catch(err){
                console.log("Error Occured while Creating an Admin User");
                console.log("Error occured is given below:- ");
                console.log(err);
            }
        }
    }catch(err){
        console.log("Error Occured while Reading the Database");
        console.log("Error occured is displayed below:- ");
        console.log(err);
    }
}

// Initializing Server by Express
app.listen(serverConfigs.PORT_NUMBER,()=>{
    // Check Server is Running or not
    console.log("Server has Started at Port Number: "+serverConfigs.PORT_NUMBER); 
});