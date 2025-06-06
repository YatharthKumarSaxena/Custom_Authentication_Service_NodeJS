/* Logic to Create User i.e User Registration*/
const impConstraints = require("./Configs/userID.config");
const UserModel = require("./Models/User.model");
const bcryptjs = require("bcryptjs")

// User ID Creation
async function makeUserID(){
    const UserList = await UserModel.find({userType: "Customer"}); // Returns an Array of Users that are Customers
    let totalCustomers = UserList.length;
    let newID = totalCustomers+1;
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
        const User = {
        name: request_body.name,
        phoneNumber: request_body.phoneNumber,
        emailId: request_body.emailId,
        password: bcryptjs.hashSync(request_body.password,8), // Password is Encrypted
        address: request_body.address,
        userID: await makeUserID()
        }
        const user = await UserModel.create(User);
        console.log("User Created Successfully, Registration Successfull");
        res.status(201).send({
            message: "Congragulations, Your Registration is Done Succesfully\n Here is your Basic Profile Details:- "
        })
    }catch(err){
        console.log("Error happened while creating a new User");
        console.log("Error occured is displayed below:- ");
        console.log(err);
        res.status(500).send({ // Error 500 Indicate Internal Server Error
            message: "An error occured in the Server while doing your registration\nSorry for this misconvinence, please try again"
        });
    }
    
    /* 3. Return the response back to the User */

}

