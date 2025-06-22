const CounterModel = require("../models/id-generator.model");
const { IP_Address_Code,userRegistrationCapacity,adminUserID } = require("../configs/user-id.config");
const { customerIDPrefix } = require("../configs/id-prefixes.config");
const { errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");

/*
  ✅ Single Responsibility Principle (SRP): 
  This function only handles the responsibility of incrementing the user counter.
  ✅ Singleton Pattern:
  Operates on a single MongoDB document (id = "CUS"), treating it as a unique entity.
*/

// Increases the value of seq field in Customer Counter Document to generate unique ID for the new user

const increaseCustomerCounter = async (res) => {
    try {
        const customerCounter = await CounterModel.findOneAndUpdate(
            { _id: customerIDPrefix },
            { $inc: { seq: 1 } },
            { new: true }
        );
        return customerCounter.seq;
    } catch (err) {
        logWithTime("🛑 Error in increasing customer counter");
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
};

/*
  ✅ SRP: This function only creates the customer counter if it doesn't exist.
  ✅ Singleton Pattern:
  Ensures only one counter document exists with ID "CUS" — maintaining global user count.
*/

// Creates Customer Counter whose seq value starts with 1 initially

const createCustomerCounter = async (res) => {
    try {
        return await CounterModel.create({
            _id: customerIDPrefix,
            seq: 1
        });
    } catch (err) {
        logWithTime("⚠️ Error creating customer counter");
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
};

// User ID Creation

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
const makeUserID = async(res) => {
    let totalCustomers = 1; // By default as Admin User Already Exists 
    let customerCounter; // To remove Scope Resolution Issue
    try{
        customerCounter = await CounterModel.findOne({_id: customerIDPrefix});
    }catch(err){
        logWithTime("⚠️ An Error Occured while accessing the Customer Counter Document");
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
    if(customerCounter){ // Means Customer Counter Exist so Just increase Counter
        totalCustomers = await increaseCustomerCounter(res);
        if(!totalCustomers)return "";
    }
    else{ // Means Customer Counter does not exist 
        customerCounter = await createCustomerCounter(res); // returns object
        if(!customerCounter)return "";
        totalCustomers = customerCounter.seq; // extract 'seq' field 
    }
    let newID = totalCustomers;
    if(newID>=userRegistrationCapacity){
        logWithTime("⚠️ Machine Capacity to Store User Data is completely full");
        logWithTime("So User cannot be Registered");
        return ""; // Returning an Empty String that indicate Now no more new user data can be registered on this machine
    }
    else{
        newID = newID+adminUserID;
        let machineCode = IP_Address_Code;
        let identityCode = customerCounter._id+machineCode;
        let idNumber = String(newID);
        const userID = identityCode+idNumber;
        return userID;
    }
}

module.exports = {
    makeUserID: makeUserID,
}