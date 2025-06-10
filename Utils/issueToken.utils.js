// Extract the required Module
const jwt = require("jsonwebtoken");
const {secretCode,expiryTimeOfJWTtoken} = require("../Configs/userID.config");
const { logWithTime } = require("../Configs/timeStampsFunctions.config");
const { errorMessage } = require("../Configs/message.configs");

exports.makeTokenByUserID = (userID) => {
    try{
        const newToken = jwt.sign({ id: userID }, secretCode, {
            expiresIn: expiryTimeOfJWTtoken
        })
        return newToken;
    }catch(err){
        logWithTime("An Error Occurred while creating the token");
        errorMessage(err);
        return null;
    }
}

exports.makeTokenByEmailID = (emailID) => {
    try{
        const newToken = jwt.sign({ emailID: emailID }, secretCode, {
            expiresIn: expiryTimeOfJWTtoken
        })
        return newToken;
    }catch(err){
        logWithTime("An Error Occurred while creating the token");
        errorMessage(err);
        return null;
    }
}

exports.makeTokenByPhoneNumber = (phoneNumber) => {
    try{
        const newToken = jwt.sign({ phoneNumber: phoneNumber }, secretCode, {
            expiresIn: expiryTimeOfJWTtoken
        })
        return newToken;
    }catch(err){
        logWithTime("An Error Occurred while creating the token");
        errorMessage(err);
        return null;
    }
}