// This is the File from where the whole Project Will Start Running

const express = require("express"); // Extract Express Module
const mongoose = require("mongoose"); // Extract Mongoose Module
const serverConfigs = require("./Configs/server.config");
const app = express(); // App is an Express Function
const dbConfigs = require("./Configs/db.config")

/*
 * Create an Admin User if not Exits at the Start of the Application
 */

// Connection with MongoDB
mongoose.connect(dbConfigs.DB_URL); // Specifying where to connect

const db = mongoose.connection; // Ordering to Connect

db.on("err",()=>{
    console.log("Error Occured while Connecting to Database");
    console.log("Error Occured is displayed below:- ");
    console.log(err);
})

db.once("open",()=>{
    console.log("Connection estabalished with MongoDB Succesfully");
})

// Initializing Server by Express
app.listen(serverConfigs.PORT_NUMBER,()=>{
    // Check Server is Running or not
    console.log("Server has Started at Port Number: "+serverConfigs.PORT_NUMBER); 
});