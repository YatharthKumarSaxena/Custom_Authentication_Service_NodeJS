// Extracting the required modules
const { expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("@configs/token.config");
const { SALT } = require("@configs/security.config");
const { UserModel }= require("@models/user.model");
const bcryptjs = require("bcryptjs")
const { errorMessage, throwInternalServerError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { makeTokenWithMongoID } = require("@utils/issue-token.util");
const { createPhoneNumber,  checkAndAbortIfUserExists } = require("@utils/auth.util");
const { makeUserID } = require("@services/userId.service");
const { createDeviceField, checkDeviceThreshold } = require("@utils/device.util");
const { setAccessTokenHeaders } = require("@utils/token-headers.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { setRefreshTokenCookie } = require("@utils/cookie-manager.util");
const { CREATED, INSUFFICIENT_STORAGE, INTERNAL_ERROR } = require("@configs/http-status.config");



/* Logic to Create User i.e User Registration */
const signUp = async (req,res) => { // Made this function async to use await
    /* 1. Read the User Request Body */
    const request_body = req.body; // Extract User Data from the User Post Request
    let emailID = request_body.emailID;

    /*
      ✅ SRP: User object is composed here only once after getting all required parts.
      ✅ DRY: Hash logic is abstracted via bcryptjs.
    */

    const newNumber = createPhoneNumber(req,res);
    if(!newNumber)return;
    
    // Checking User already exists or not 
    const userExist = await checkAndAbortIfUserExists(emailID.trim().toLowerCase(), newNumber, res);
    if(userExist)return;
    const password = await bcryptjs.hash(request_body.password, SALT); // Password is Encrypted
    const device = createDeviceField(req,res);
    if(!device){
        logWithTime(`❌ Device creation failed for User for device id: (${req.deviceID}) at the time of Sign Up Request`);
        return throwInternalServerError(res);
    }

    /* 2. Insert the Data in the Users Collection of Mongo DB ecomm_db Database */ 
    let generatedUserID; // To resolve Scope Resolution Issue
    try{
        generatedUserID= await makeUserID(res); // Generating Customer ID 
        if (generatedUserID === "") { // Check that Machine can Accept More Users Data or not
            return res.status(INSUFFICIENT_STORAGE).json({
                success: false,
                message: "User limit reached. Cannot register more users at this time."
            });
        }
    }catch(err){
        logWithTime(`⚠️ Error Occured while making the User ID of Phone Number: (${req.body.phoneNumber}) and EmailID (${req.body.emailID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }

    const { countryCode,number } = request_body.phoneNumber;
    const User = {
        phoneNumber: {
            countryCode: countryCode,
            number: number
        },
        phone: newNumber,
        emailID: request_body.emailID,
        password: password,
        userID: generatedUserID,
        devices:{
            info: []
        }
    }
    try{
        const user = await UserModel.create(User);
        req.user = user;
        logWithTime(`🟢 User (${user.userID}) Created Successfully, Registration Successfull from device id: (${req.deviceID})`);
        const userGeneralDetails = {
            emailID: user.emailID,
            userID: user.userID,
            phone: newNumber,
            userType: user.userType,
            createdAt: user.createdAt,
            devices:{
                info: []
            }
        }

        // Update data into auth.logs
        logAuthEvent(req, "REGISTER", null);

        const userDisplayDetails = {
            details:"Here is your Basic Profile Details given below:-", 
            userID: user.userID,
            emailId: user.emailID,
            phoneNumber: newNumber
        }

        logWithTime("👤 New User Details:- ");
        console.log(userGeneralDetails);
        // Before Automatic Login Just verify that device threshold has not exceeded
        const isThresholdCrossed = await checkDeviceThreshold(req.deviceID,res);
        if(isThresholdCrossed)return;
        // Refresh Token Generation
        const refreshToken = await makeTokenWithMongoID(req,res,expiryTimeOfRefreshToken);
        if(!refreshToken){
            logWithTime(`❌ Refresh Token generation failed after successful registration for User (${user.userID})!. User registered from device id: (${req.deviceID})`);
            return res.status(INTERNAL_ERROR).json({
                success: false,
                message: "User registered but login (token generation) failed. Please try logging in manually.",
                userDisplayDetails
            });
        }
        const isCookieSet = setRefreshTokenCookie(res,refreshToken);
        if(!isCookieSet){
            logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the time of Registration. Request is made from device ID: (${req.deviceID})`);
            return;
        }
        user.jwtTokenIssuedAt = Date.now();
        await user.save();
        const isUserLoggedIn = await loginTheUser(user,refreshToken,device,res);
        if(!isUserLoggedIn){
            logWithTime(`❌ An Internal Error Occurred in logging in the user (${user.userID}) at the time of Registration. Request is made from device ID: (${req.deviceID})`);
            return;
        }

        // Update data into auth.logs
        logAuthEvent(req, "LOGIN", null);

        const accessToken = await makeTokenWithMongoID(req,res,expiryTimeOfAccessToken);
        if(!accessToken){
            logWithTime(`❌ Access token creation failed for User (${user.userID}) at the time of sign up request. Request is made from device id: (${req.deviceID})`);
            return throwInternalServerError(res);
        }
        const isAccessTokenSet = setAccessTokenHeaders(res,accessToken);
        if(!isAccessTokenSet){
            logWithTime(`❌ Access token set in header failed for User (${user.userID}) at the time of sign up request. Request is made from device id: (${req.deviceID})`);
            return throwInternalServerError(res);
        }
        logWithTime(`🟢 User (${user.userID}) is successfully logged in on registration from device id: (${req.deviceID})`);
    /* 3. Return the response back to the User */
        return res.status(CREATED).json({
            success: true,
            message: "Congratulations, Your Registration as well as login is Done Successfully :- ",
            userDisplayDetails,
        })
    }catch(err){
        logWithTime(`❌ Internal Error: Error Occured while creating the User having Phone Number: (${req.body.phoneNumber}) and EmailID: (${req.body.emailID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = { 
    signUp 
}