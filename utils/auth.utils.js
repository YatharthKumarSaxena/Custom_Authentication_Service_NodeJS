const { errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const bcryptjs = require("bcryptjs");

const validateSingleIdentifier = (req,res) => {
    const identifiers = [req.body.phoneNumber, req.body.emailID, req.body.userID].filter(Boolean);
    if (identifiers.length !== 1) {
        logWithTime(`🧷 Invalid input: More than one or no identifier provided for UserID: (${req.user.userID}) from device id: (${req.deviceID}).`);
        res.status(400).send({
            success: false,
            message: "❌ Provide exactly one identifier: userID, phoneNumber, or emailID."
        }) 
        return false;
    }
    logWithTime(`🧩 Valid identifier input detected for UserID: (${req.user.userID}) from device id: (${req.deviceID}).`);
    return true;
};

// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
const checkUserExists = async(emailID,phoneNumber,res) => {
    try{
        let count = 0;
        let user = await UserModel.findOne({phoneNumber: phoneNumber})
        let reason = "";
        if(user){
            logWithTime("⚠️ User Already Exists with Phone Number: "+phoneNumber);
            reason = "Phone Number: "+phoneNumber;
            count++;
        }
        user = await UserModel.findOne({emailID: emailID});
        if(user){
            logWithTime("⚠️ User Already Exists with Email ID: "+emailID);
            if(count)reason= "Phone Number: "+phoneNumber+" and Email ID: "+emailID;
            else reason = "Email ID: "+emailID;
            count++;
        }
        if(count!==0)logWithTime("⚠️ Invalid Registration");
        return reason;
    }catch(err){
        logWithTime(`❌ An Internal Error occurred while checking existing user with phone number: (${phoneNumber}) and emailID: (${emailID}).`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

const checkPasswordIsValid = async(req,user) => {
    const providedPassword = req.body.password;
    const actualPassword = user.password;
    const isPasswordValid = await bcryptjs.compare(providedPassword, actualPassword);
    return isPasswordValid;
}

const isAdminID = (userID) => {
    return typeof userID === "string" && userID.startsWith("ADM");
};

module.exports = {
  validateSingleIdentifier: validateSingleIdentifier,
  checkPasswordIsValid: checkPasswordIsValid,
  checkUserExists: checkUserExists,
  isAdminID: isAdminID
}