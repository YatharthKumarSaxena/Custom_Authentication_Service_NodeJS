/* Logic to Create User i.e User Registration*/
const impConstraints = require("./Configs/userID.config");
const UserModel = require("./Models/User.model");
const bcryptjs = require("bcryptjs")
const CounterModel = require("./Models/ID_Generator.model");

function errorMessage(err){
    console.log("Error occurred is given below:- ");
    console.log(err);
}

function throwErrorResponse(res){
    res.status(500).send({ // Error 500 Indicate Internal Server Error
        message: "An error occurred in the Server while doing your registration\nSorry for this inconvenience, please try again"
    });
}

// User ID Creation
async function makeUserID(){
    let totalCustomers = 1; // By default as Admin User Already Exists 
    let customerCounter // To remove Scope Resolution Issue
    try{
        customerCounter = await CounterModel.findOne({_id: "CUS"});
    }catch(err){
        console.log("An Error Occured while accessing the Customer Counter Document");
        errorMessage(err);
        return;
    }
    if(customerCounter){ // Means Customer Counter Exist so Just increase Counter
        try{
            customerCounter = await CounterModel.findOneAndUpdate(
                { _id: "CUS" },
                { $inc: { seq: 1 } },
                { new: true } // This will force Mongo DB to return updated document
                // By Default MongoDB returns old documents even after updation
            );
            totalCustomers = customerCounter.seq;
        }catch(err){
            console.log("An Error Occured in findOneAndUpdate function applied on Customer Counter Document")
            errorMessage(err);
            return;
        }
    }
    else{ // Means Customer Counter does not exist 
        // Create Customer Counter Document with seq value 1 
        try{
            const customerCounter = await CounterModel.create({
                _id: "CUS",
                seq: 1
                // totalCustomers is by default 1 taken so not need to reassign same value
            });
        }catch(err){
            errorMessage(err);
            return;
        }      
    }
    let newID = totalCustomers;
    if(newID>=impConstraints.userRegistrationCapacity){
        console.log("Machine Capacity to Store User Data is completely full");
        console.log("So User cannot be Registered");
        return ""; // Returning an Empty String that indicate Now no more new user data can be registered on this machine
    }
    else{
        let machineCode = String(impConstraints.machineCode);
        let idNumber = String(newID+impConstraints.adminID);
        const userID = machineCode+idNumber;
        return userID;
    }
}

exports.signUp = async (req,res) => { // Made this function async to use await
    /* 1. Read the User Request Body */
    const request_body = req.body; // Extract User Data from the User Post Request
    /* 2. Insert the Data in the Users Collection of Mongo DB ecomm_db Database */ 
    try{
        const generatedUserID= await makeUserID(res); // Generating Customer ID 
        if (generatedUserID === "") { // Check that Machine can Accept More Users Data or not
            return res.status(507).send({
                message: "User limit reached. Cannot register more users at this time."
            });
        }
    }catch(err){
        console.log("Error Occured while making the User ID");
        errorMessage(err)
        throwErrorResponse(res);
        return;
    }
    const User = {
        name: request_body.name,
        phoneNumber: request_body.phoneNumber,
        emailId: request_body.emailId,
        password: bcryptjs.hashSync(request_body.password,8), // Password is Encrypted
        address: request_body.address,
        userID: generatedUserID
    }
    try{
        const user = await UserModel.create(User);
        console.log("User Created Successfully, Registration Successfull");
        res.status(201).send({
            message: "Congratulations, Your Registration is Done Successfully\n Here is your Basic Profile Details:- "
        })
    }catch(err){
        console.log("Error happened while creating a new User");
        errorMessage(err);
        throwErrorResponse(res);
        return;
    }
    
    /* 3. Return the response back to the User */

}

