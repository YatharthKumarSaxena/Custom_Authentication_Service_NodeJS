// Extracting required Modules, their functions and values
const { throwInvalidResourceError, throwResourceNotFoundError, throwInternalServerError, errorMessage, logMiddlewareError, getLogIdentifiers } = require("../configs/error-handler.configs");
const UserModel = require("../models/user.model");
const { logWithTime } = require("../utils/time-stamps.utils");

const fetchUser = async(req,res) =>{
    try{
        let user;
        let verifyWith = "";
        let anyResourcePresent = true;
        if(req?.query?.userID){
            user = await UserModel.findOne({userID: req.query.userID.trim()});
            if(user){
                verifyWith = verifyWith+"USER_ID";
            }
        }
        else if (req?.query?.emailID){
            user = await UserModel.findOne({emailID: req.query.emailID.trim().toLowerCase()});
            if(user){
                verifyWith = verifyWith+"EMAIL";
            }
        }
        else if (req?.query?.fullPhoneNumber){
            user = await UserModel.findOne({fullPhoneNumber: req.query.fullPhoneNumber.trim()});
            if(user){
                verifyWith = verifyWith+"PHONE";
            }
        }
        else if(req?.body?.userID){
            user = await UserModel.findOne({userID: req.body.userID.trim()});
            if(user){
                verifyWith = verifyWith+"USER_ID";
            }
        }else if(req?.body?.emailID){
            user = await UserModel.findOne({emailID: req.body.emailID.trim().toLowerCase()});
            if(user){
                verifyWith = verifyWith+"EMAIL";
            }
        }else if(req?.body?.fullPhoneNumber){
            user = await UserModel.findOne({fullPhoneNumber: req.body.fullPhoneNumber.trim()});
            if(user){
                verifyWith = verifyWith+"PHONE";
            }
        }else{
            anyResourcePresent = false;
        }
        if(!anyResourcePresent){
            const resource = "Phone Number, Email ID or Customer ID (Any One of these field)";
            logMiddlewareError("Fetch User, No resource provided to identify User",req);
            throwResourceNotFoundError(res,resource);
            return verifyWith;
        }
        if(!user){
            logMiddlewareError("Fetch User, Unauthorized User details provided",req);
            throwInvalidResourceError(res, "Phone Number, Email ID or Customer ID");
            return verifyWith;
        }
        // Attach the verified user's identity source and the user object to the request 
        // This prevents redundant DB lookups in the controller and makes downstream logic cleaner and faster
        req.verifyWith = verifyWith;
        req.foundUser = user;
        logWithTime(`🆔 User identified using: ${verifyWith}`);
        return verifyWith;
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while fetching the User Request ${getIdentifiers}`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

module.exports = {
    fetchUser: fetchUser
}