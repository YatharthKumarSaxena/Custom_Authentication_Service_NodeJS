const { errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");
const { expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const { httpOnly,sameSite,secure } = require("../configs/cookies.config");
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

// DRY Principle followed by this Code
const checkUserIsNotVerified = async(user,res) => {
    try{
        if(user.isVerified === false)return true; // SignOut Introduces this Feature
        const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
        const currentTime = Date.now(); // In milli second current time is return
        if(currentTime > tokenIssueTime + expiryTimeOfRefreshToken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
            user.isVerified = false;
            user.refreshToken = null;
            user.devices.length = 0;
            res.clearCookie("refreshToken", { httpOnly: httpOnly, secure: secure, sameSite: sameSite });
            await user.save(); // 👈 Add this line
            return true; // 🧠 session expired, response already sent
        }
        return false; // ✅ token valid, continue execution
    }catch(err){
        logWithTime(`❌ An Internal Error Occurred while verifying the User Request`);
        errorMessage(err);
        throwInternalServerError(res);
        return true;
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
  checkUserIsNotVerified: checkUserIsNotVerified,
  checkPasswordIsValid: checkPasswordIsValid,
  checkUserExists: checkUserExists,
  isAdminID: isAdminID
}