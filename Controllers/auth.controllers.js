/* Logic to Create User i.e User Registration */

/*  
  ✅ This file handles the logic for User Registration in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const impConstraints = require("../Configs/userID.config");
const UserModel = require("../Models/User.model");
const bcryptjs = require("bcryptjs")
const CounterModel = require("../Models/ID_Generator.model");
const messageModel = require("../Configs/message.configs");
const errorMessage = messageModel.errorMessage;
const throwInternalServerError = messageModel.throwInternalServerError;

/*
  ✅ Single Responsibility Principle (SRP): 
  This function only handles the responsibility of incrementing the user counter.
  ✅ Singleton Pattern:
  Operates on a single MongoDB document (id = "CUS"), treating it as a unique entity.
*/

async function increaseCustomerCounter(){
    try{
        const customerCounter = await CounterModel.findOneAndUpdate(
            { _id: "CUS" },
            { $inc: { seq: 1 } },
            { new: true } // This will force Mongo DB to return updated document
            // By Default MongoDB returns old documents even after updation
        );
        return customerCounter.seq;
    }catch(err){
        console.log("🛑 An Error Occured in findOneAndUpdate function applied on Customer Counter Document")
        errorMessage(err);
        return;
    }
}

/*
  ✅ SRP: This function only creates the customer counter if it doesn't exist.
  ✅ Singleton Pattern:
  Ensures only one counter document exists with ID "CUS" — maintaining global user count.
*/

async function createCustomerCounter(){
// Create Customer Counter Document with seq value 1 
    try{
        const customerCounter = await CounterModel.create({
            _id: "CUS",
            seq: 1
            // totalCustomers is by default 1 taken so not need to reassign same value
        });
        return customerCounter;
    }catch(err){
        errorMessage(err);
        return;
    } 
}

/*
  ✅ Factory Pattern:
  This function encapsulates the logic to "create" a new userID based on machine code and total customers.
  The logic varies dynamically depending on counter state but the output structure is consistent — like a factory.
  
  ✅ Open-Closed Principle (OCP):
  The function is closed for modification but open for extension.
  In future, more logic can be added to generate userIDs differently for different user types without modifying this logic directly.
  
  ✅ SRP:
  It only deals with userID creation and nothing else — clean separation.
*/

// User ID Creation
async function makeUserID(){
    let totalCustomers = 1; // By default as Admin User Already Exists 
    let customerCounter // To remove Scope Resolution Issue
    try{
        customerCounter = await CounterModel.findOne({_id: "CUS"});
    }catch(err){
        console.log("⚠️ An Error Occured while accessing the Customer Counter Document");
        errorMessage(err);
        return;
    }
    if(customerCounter){ // Means Customer Counter Exist so Just increase Counter
        totalCustomers = await increaseCustomerCounter();
    }
    else{ // Means Customer Counter does not exist 
        customerCounter = await createCustomerCounter(); // returns object
        totalCustomers = customerCounter.seq; // extract 'seq' field 
    }
    let newID = totalCustomers;
    if(newID>=impConstraints.userRegistrationCapacity){
        console.log("⚠️ Machine Capacity to Store User Data is completely full");
        console.log("So User cannot be Registered");
        return ""; // Returning an Empty String that indicate Now no more new user data can be registered on this machine
    }
    else{
        newID = newID+impConstraints.adminID
        let machineCode = impConstraints.IP_Address_Code;
        let identityCode = customerCounter._id+machineCode;
        let idNumber = String(newID);
        const userID = identityCode+idNumber;
        return userID;
    }
}

/*
  ✅ Template Method Pattern:
  The `signUp()` function acts as a template that:
    1. Extracts request
    2. Generates a user ID
    3. Encrypts password
    4. Saves to DB
    5. Sends response
  This linear fixed structure is characteristic of the Template Method Design Pattern.

  ✅ SRP:
  Handles the single responsibility of registration workflow.

  ✅ DRY:
  Uses `throwErrorResponse()` and `errorMessage()` for consistency.
*/

exports.signUp = async (req,res) => { // Made this function async to use await
    /* 1. Read the User Request Body */
    const request_body = req.body; // Extract User Data from the User Post Request

    /* 2. Insert the Data in the Users Collection of Mongo DB ecomm_db Database */ 
    let generatedUserID; // To resolve Scope Resolution Issue
    try{
        generatedUserID= await makeUserID(); // Generating Customer ID 
        if (generatedUserID === "") { // Check that Machine can Accept More Users Data or not
            return res.status(507).send({
                message: "User limit reached. Cannot register more users at this time."
            });
        }
    }catch(err){
        console.log("⚠️ Error Occured while making the User ID");
        errorMessage(err)
        throwInternalServerError(res);
        return;
    }

    /*
      ✅ SRP: User object is composed here only once after getting all required parts.
      ✅ DRY: Hash logic is abstracted via bcryptjs.
    */

    const SALT = impConstraints.SALT; // Extracting SALT for Encryption of Password
    const User = {
        name: request_body.name,
        phoneNumber: request_body.phoneNumber,
        emailID: request_body.emailID,
        password: bcryptjs.hashSync(request_body.password,SALT), // Password is Encrypted
        address: request_body.address,
        userID: generatedUserID
    }
    try{
        const user = await UserModel.create(User);
        console.log("🟢 User Created Successfully, Registration Successfull");
    /* 3. Return the response back to the User */
        return res.status(201).send({
            message: "Congratulations, Your Registration is Done Successfully :- ",
            details:"Here is your Basic Profile Details given below:-", 
            name: user.name,
            userID: user.userID,
            emailId: user.emailID,
            phoneNumber: user.phoneNumber,
            address: user.address
        })
    }catch(err){
        console.log("⚠️ Error happened while creating a new User");
        errorMessage(err);
        throwInternalServerError(res);
        return;
    }
}

// Logic to Login the Registered User

exports.signIn = async (req,res) => {
    try{

    }catch(err){

    }
    const user = await UserModel.findOne({
        $or:[
            {userID: req.body.userID},
            {phoneNumber: req.body.phoneNumber},
            {emailID: req.body.emailID}
        ]
    });
    if(user === null){
        resource = "Phone Number, Email ID or Customer ID (Any One of these field)"
        throwResourceNotFoundError(res,resource)
    }
}