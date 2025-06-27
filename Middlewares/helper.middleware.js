// Extracting required Modules, their functions and values
const { throwInvalidResourceError, throwResourceNotFoundError, throwInternalServerError, errorMessage } = require("../configs/error-handler.configs");
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
        else if (req?.query?.phoneNumber){
            user = await UserModel.findOne({phoneNumber: req.query.phoneNumber.trim()});
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
        }else if(req?.body?.phoneNumber){
            user = await UserModel.findOne({phoneNumber: req.body.phoneNumber.trim()});
            if(user){
                verifyWith = verifyWith+"PHONE";
            }
        }else{
            anyResourcePresent = false;
        }
        if(!anyResourcePresent){
            const resource = "Phone Number, Email ID or Customer ID (Any One of these field)"
            throwResourceNotFoundError(res,resource);
            return verifyWith;
        }
        if(!user){
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
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while fetching the User Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

module.exports = {
    fetchUser: fetchUser
}