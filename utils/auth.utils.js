const { errorMessage,throwInternalServerError,throwInvalidResourceError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const bcryptjs = require("bcryptjs");
const { BAD_REQUEST } = require("../configs/http-status.config");
const { isValidRegex,validateLength } = require("../utils/field-validators");
const { fullPhoneNumberRegex } = require("../configs/regex.config");
const { fullPhoneNumberLength } = require("../configs/fields-length.config");

const validateSingleIdentifier = (req, res, source = 'body') => {
    const identifierKeys = ['userID', 'emailID', 'phoneNumber'];
    const data = req[source];

    const validIdentifiers = identifierKeys.filter(key =>
        data.hasOwnProperty(key) && typeof data[key] === 'string' && data[key].trim() !== ''
    );

    if (validIdentifiers.length !== 1) {
        logWithTime(`🧷 Invalid input: More than one or no identifier provided from device id: (${req.deviceID}).`);
        res.status(BAD_REQUEST).send({
            success: false,
            message: "❌ Provide exactly one identifier: userID, phoneNumber, or emailID."
        });
        return false;
    }

    // 🧼 Remove extra identifiers
    const selectedKey = validIdentifiers[0];
    identifierKeys.forEach(key => {
        if (key !== selectedKey && key in data) {
            delete data[key];
        }
    });

    logWithTime(`🧩 Valid identifier input detected from device id: (${req.deviceID}).`);
    return true;
};


// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
const checkUserExists = async(emailID,phoneNumber,res) => {
    try{
        let count = 0;
        let user = await UserModel.findOne({fullPhoneNumber: phoneNumber})
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
    const userWithPassword = await UserModel.findOne({ userID: user.userID }).select("+password");
    if (!userWithPassword) return false;
    const actualPassword = userWithPassword.password;
    const isPasswordValid = await bcryptjs.compare(providedPassword, actualPassword);
    return isPasswordValid;
}

const isAdminID = (userID) => {
    return typeof userID === "string" && userID.startsWith("ADM");
};

const createFullPhoneNumber = (req,res) => {
    try{
        const { countryCode,number } = req.body.phoneNumber;
        const newNumber = "+" + countryCode + number;
        if(!validateLength(newNumber,fullPhoneNumberLength.min,fullPhoneNumberLength.max)){
            const userID = req.user.userID || "Unauthorized User";
            logWithTime(`Invalid Full Phone Number Length provided by ${userID} to update full phone number`);
            throwInvalidResourceError(res, `Full Phone Number, Full Phone Number must be at least ${fullPhoneNumberLength.min} digits long and not more than ${fullPhoneNumberLength.max} digits`);
            return null;
        }
        if(!isValidRegex(newNumber,fullPhoneNumberRegex)){
            const userID = req?.user?.userID || "New User";
            logWithTime(`Invalid Full Phone Number Format provided by ${userID} to update full phone number`);
            throwInvalidResourceError(
                res,
                "Full phone number Format, Please enter a valid full phone number that consist of only numeric digits .",
            );
            return null;
        }
        const userID = req.user?.userID || req?.foundUser?.userID || "New User";
        logWithTime(`Full Phone Number Created Successfully for User with ${userID}`)
        return newNumber;
    }catch(err){
        const userID = req.user?.userID || req?.foundUser?.userID || "New User";
        logWithTime(`An Error Occurred while creating full phone number for User with ${userID}`);
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

module.exports = {
  validateSingleIdentifier: validateSingleIdentifier,
  createFullPhoneNumber: createFullPhoneNumber,
  checkPasswordIsValid: checkPasswordIsValid,
  checkUserExists: checkUserExists,
  isAdminID: isAdminID
}