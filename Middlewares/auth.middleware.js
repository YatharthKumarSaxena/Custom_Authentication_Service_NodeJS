/* This file is of MiddleWare that will handle request flow between Router and Controller*/ 
/* This file decides whether request from Router must be sent to Controller or not */

// Flow of Request :- 
/* App(Express Server)->Routers->Middlewares->Controllers->Models */
/* If an Error Occured in Middleware then Middleware will throw an Error , Request will not be forwarded to Controller */

// Extracting the Required Modules
const UserModel = require("../Models/User.model");
const messageModel = require("../Configs/message.configs");
const errorMessage = messageModel.errorMessage;
const throwResourceNotFoundError = messageModel.throwResourceNotFoundError;
const throwInternalServerError = messageModel.throwInternalServerError;

// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
async function checkUserExists(emailID,phoneNumber){
    try{
        let count = 0;
        let user1 = await UserModel.findOne({phoneNumber: phoneNumber})
        let reason = "";
        if(user1){
            console.log("⚠️ User Already Exists with Phone Number: "+phoneNumber);
            reason = "Phone Number: "+phoneNumber;
            count++;
        }
        user1 = await UserModel.findOne({emailID: emailID});
        if(user1){
            console.log("⚠️ User Already Exists with Email ID: "+emailID);
            if(count)reason= "Phone Number: "+phoneNumber+" and Email ID: "+emailID;
            else reason = "Email ID: "+emailID;
            count++;
        }
        if(count!==0)console.log("⚠️ Invalid Registration");
        return reason;
    }catch(err){
        console.log("⚠️ An Error occured while Checking whether User Exists or not");
        errorMessage(err);
        return;
    }
}

const verifySignUpBody = async (req,res,next) =>{
    // Validating the User Request
    try{
        // Check name is present in Request Body or not
        let userIsValid = true; // Assuming that Request Provided is correct
        let reason = ""; // Stores Reason for Invalid Request
        if(!req.body.name){
            userIsValid = false;
            reason = reason+"Name";
        }
        // Check Email ID is present in Request Body or not
        if(!req.body.emailID){
            if(userIsValid)reason = reason+"Email ID";
            else reason = reason+" ,Email ID";
            userIsValid = false;
        }
        // Check Phone Number is present in Request Body or not
        if(!req.body.phoneNumber){
            if(userIsValid)reason = reason+"Phone Number";
            else reason = reason+" ,Phone Number";
            userIsValid = false;
        }
        // Check Password is present in Request Body or not
        if(!req.body.password){
            if(userIsValid)reason = reason+"Password";
            else reason = reason+" ,Password";
            userIsValid = false;
        }
        // Check Address is present in Request Body or not
        if (
        !Array.isArray(req.body.address) || 
        req.body.address.length === 0 || 
        Object.keys(req.body.address[0]).length === 0  // <-- Empty object check
        ) {
            if(userIsValid)reason = reason+"Address";
            else reason = reason+" and Address";
            userIsValid = false;
        }
        else{ // Check inner Address details are present or not
            const address = req.body.address[0];
            if(!address.localAddress){
                if(userIsValid)reason = reason+"Local Address field in Address field";
                else reason = reason+", Local Address field in Address field";
                userIsValid = false;
            }
            if(!address.city){
                if(userIsValid)reason = reason+"City field in Address field";
                else reason = reason+", City field in Address field";
                userIsValid = false;
            }
            if(!address.pincode){
                if(userIsValid)reason = reason+"Pincode field in Address field";
                else reason = reason+", Pincode field in Address field";
                userIsValid = false;
            }
            if(!address.state){
                if(userIsValid)reason = reason+"State field in Address field";
                else reason = reason+", State field in Address field";
                userIsValid = false;
            }
            if(!address.country){
                if(userIsValid)reason = reason+"and Country field in Address field";
                else reason = reason+" and Country field in Address field";
                userIsValid = false;
            }
        }
        if(userIsValid){ // Check that User Exists with Phone Number or Email ID
            let emailID = req.body.emailID;
            let phoneNumber = req.body.phoneNumber;
            // Checking User already exists or not 
            const userExistReason = await checkUserExists(emailID,phoneNumber);
            if(userExistReason !== ""){
                res.send({
                message: "User Already Exists with "+userExistReason,
                warning: "Use different Email ID or Phone Number or both based on Message"
            })
            return;
            }
        }
        else{ // Throw Error as User Details are not properly given
            throwResourceNotFoundError(res,reason);
            return;
        }
        next();  // ✅ All validations passed, forward to controller
    }catch(err){
        console.log("⚠️ Error happened while validating the User Request");
        errorMessage(err);
        throwInternalServerError(res);
        return;
    }
}

module.exports = {
    verifySignUpBody: verifySignUpBody
}