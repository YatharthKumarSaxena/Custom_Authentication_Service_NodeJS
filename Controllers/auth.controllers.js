/*  
  ✅ This file handles the logic for User Registration and User Login in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const { SALT, expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const UserModel = require("../models/user.model");
const bcryptjs = require("bcryptjs")
const { throwInvalidResourceError, errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { makeTokenWithMongoID } = require("../utils/issue-token.utils");
const { httpOnly, secure, sameSite } = require("../configs/cookies.config");
const { checkUserExists, checkPasswordIsValid } = require("../utils/auth.utils");
const { signInWithToken } = require("../services/token.service");
const { makeUserID } = require("../services/userID.service");
const { createDeviceField, getDeviceByID, checkThresholdExceeded } = require("../utils/device.utils");
const { checkUserIsNotVerified } = require("../utils/auth.utils");

/*
  ✅ Template Method Pattern:
  The `signUp()` function acts as a template that:
    1. Extracts request
    2. Generates a user ID
    3. Encrypts password
    4. Saves to DB
    5. Sends response
  This linear fixed structure is characteristic of the Template Method Design Pattern.

  ✅ SRP:
  Handles the single responsibility of registration workflow.

  ✅ DRY:
  Uses `throwErrorResponse()` and `errorMessage()` for consistency.
*/

/* Logic to Create User i.e User Registration */
exports.signUp = async (req,res) => { // Made this function async to use await
    /* 1. Read the User Request Body */
    const request_body = req.body; // Extract User Data from the User Post Request
    // Check that User Exists with Phone Number or Email ID
    let emailID = request_body.emailID.trim().toLowerCase();
    let phoneNumber = request_body.phoneNumber.trim();
    // Checking User already exists or not 
    const userExistReason = await checkUserExists(emailID,phoneNumber,res);
    if(userExistReason !== ""){
        return res.status(400).json({
            message: "User Already Exists with "+userExistReason,
            warning: "Use different Email ID or Phone Number or both based on Message"
        })
    }
    /* 2. Insert the Data in the Users Collection of Mongo DB ecomm_db Database */ 
    let generatedUserID; // To resolve Scope Resolution Issue
    try{
        generatedUserID= await makeUserID(res); // Generating Customer ID 
        if (generatedUserID === "") { // Check that Machine can Accept More Users Data or not
            return res.status(507).json({
                message: "User limit reached. Cannot register more users at this time."
            });
        }
    }catch(err){
        logWithTime(`⚠️ Error Occured while making the User ID of Phone Number: (${req.body.phoneNumber}) and EmailID (${req.body.emailID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }

    /*
      ✅ SRP: User object is composed here only once after getting all required parts.
      ✅ DRY: Hash logic is abstracted via bcryptjs.
    */
    const password = await bcryptjs.hash(request_body.password, SALT); // Password is Encrypted
    const device = createDeviceField(req,res);
    if(!device)return;
    const User = {
        name: request_body.name,
        phoneNumber: request_body.phoneNumber,
        emailID: request_body.emailID,
        password: password,
        userID: generatedUserID,
        devices: [device]
    }
    try{
        const user = await UserModel.create(User);
        logWithTime(`🟢 User (${user.userID}) Created Successfully, Registration Successfull from device id: (${req.deviceID})`);
        const userGeneralDetails = {
            name: user.name,
            emailID: user.emailID,
            userID: user.userID,
            userType: user.userType,
            createdAt: user.createdAt,
            devices: [device]
        }
        // Update data into auth.logs
        await logAuthEvent(req, "REGISTER", { performedOn: user });
        const userDisplayDetails = {
            details:"Here is your Basic Profile Details given below:-", 
            name: user.name,
            userID: user.userID,
            emailId: user.emailID,
            phoneNumber: user.phoneNumber,
        }
        // Refresh Token Generation
        const refreshToken = await makeTokenWithMongoID(req,res,expiryTimeOfRefreshToken)
        if(!refreshToken){
            logWithTime(`❌ Refresh Token generation failed after successful registration for User (${user.userID})!. User registered from device id: (${req.deviceID})`);
            return res.status(500).json({
                message: "User registered but login (token generation) failed. Please try logging in manually.",
                userDisplayDetails
            });
        }
        res.cookie("refreshToken", refreshToken, {
            httpOnly: httpOnly, // 🟡 Temporarily allow Postman/browser JS to read
            secure: secure,   // 🧪 Optional in localhost, but true in prod
            sameSite: sameSite, // Postman compatibility
            maxAge: expiryTimeOfRefreshToken * 1000
        });
        user.refreshToken = refreshToken;
        user.isVerified = true;
        user.loginCount = 1;
        user.lastLogin = Date.now();
        await user.save(); // save token in DB
        // Update data into auth.logs
        await logAuthEvent(req, "LOGIN", { performedOn: user });
        const accessToken = await makeTokenWithMongoID(req,res,expiryTimeOfAccessToken);
        // Generate Access Token for User
        res.setHeader("x-access-token", accessToken);
        // Smart signal to frontend that Access token is Refreshed now
        res.setHeader("x-token-refreshed", "true"); 
        res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
        logWithTime(`🟢 User (${user.userID}) is successfully logged in on registration from device id: (${req.deviceID})!`);
        logWithTime("👤 New User Details:- ");
        console.log(userGeneralDetails);
    /* 3. Return the response back to the User */
        return res.status(201).json({
            message: "Congratulations, Your Registration as well as login is Done Successfully :- ",
            userDisplayDetails,
        })
    }catch(err){
        logWithTime(`❌ Internal Error: Error Occured while creating the User having Phone Number: (${req.body.phoneNumber}) and EmailID: (${req.body.emailID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

/* Logic to Login the Registered User */
exports.signIn = async (req,res) => {
    try{
        let user = req.foundUser;
        if(!user){
            const userID =  req?.foundUserID || req?.user?.userID || req?.body?.userID;
            user = await UserModel.findOne({userID: userID});
            if(!user){
                return throwInvalidResourceError(res,"UserID");
            }
            req.foundUser = user;
        }
        let device = getDeviceByID(user,req.deviceID)
        if(device){
            device.lastUsedAt = Date.now();
            await user.save();
            logWithTime(`⚠️ Access Denied: User with userID: (${user.userID}) attempted to login on same device id (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: "User is already logged in.",
                suggestion: "Please logout first before trying to login again."
            });
        };
        const isThresholdCrossed = checkThresholdExceeded(req,res);
        if(isThresholdCrossed)return;
        device = createDeviceField(req,res);
        user = req.foundUser;
        // ✅ Now Check if User is Already Logged In
        const result = await checkUserIsNotVerified(user,res);
        if (!result) {
            logWithTime(`🚫 Request Denied: User with userID: (${user.userID}) is already logged in.User tried this from device id: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: "User is already logged in.",
                suggestion: "Please logout first before trying to login again."
            });
        }
        // Check Password is Correct or Not
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(isPasswordValid){ // Login the User
            // Sign with JWT Token
            const refreshToken = await signInWithToken(req,res);
            if (refreshToken === "") {
                logWithTime(`❌ Refresh token generation failed during login of User with userID: (${user.userID}) from device id: (${req.deviceID})`);
                return throwInternalServerError(res);
            }
            res.cookie("refreshToken", refreshToken, {
                httpOnly: httpOnly, // 🟡 Temporarily allow Postman/browser JS to read
                secure: secure,   // 🧪 Optional in localhost, but true in prod
                sameSite: sameSite, // Postman compatibility
                maxAge: expiryTimeOfRefreshToken * 1000
            });
            user.refreshToken = refreshToken;
            user.isVerified = true; // Marked User as Verified
            user.jwtTokenIssuedAt = Date.now(); // Update JWT token issued time
            user.lastLogin = Date.now(); // Update Last Login Time of User
            user.loginCount = user.loginCount + 1;
            user.devices.push(device);
            await user.save();
            await logAuthEvent(req, "LOGIN", { performedOn: user });
            const accessToken = await makeTokenWithMongoID(req,res,expiryTimeOfAccessToken);
            // Generate Access Token for User
            res.setHeader("x-access-token", accessToken);
            // Smart signal to frontend that Access token is Refreshed now
            res.setHeader("x-token-refreshed", "true"); 
            res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
            logWithTime(`🔐 User with (${user.userID}) is Successfully logged in from device id: (${req.deviceID})`);
            return res.status(200).json({
                message: "Welcome "+user.name+", You are successfully logged in",
                userID: user.userID,
            })
        }
        else{
            logWithTime(`❌ Incorrect Password provided by User with userID: (${user.userID}) for Login Purpose from device id: (${req.deviceID})`);
            return throwInvalidResourceError(res,"Password");
        }
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while logging in the User with userID: (${userID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }  
}

exports.signOut = async (req,res) => {
    try{
        let user = req.user;
        if(!user){
            return throwInvalidResourceError(res,"UserID");
        }
        user.refreshToken = null;
        user.isVerified = false;
        user.lastLogout = Date.now();
        user.devices.length = 0;
        res.clearCookie("refreshToken", { httpOnly: httpOnly, sameSite: sameSite, secure: secure });
        await user.save();
        // Update data into auth.logs
        await logAuthEvent(req, "LOGOUT_ALL_DEVICE", { performedOn: user });    
        if (user.isBlocked) {
            logWithTime(`⚠️ Blocked user ${user.userID} attempted to logout from all devices from (${req.deviceID}).`);
            return throwBlockedAccountError(res); // ✅ Don't proceed if blocked
        }
        else logWithTime(`🔓 User with (${user.userID}) is Successfully logged out from all devices. User used device having device ID: (${req.deviceID})`);
        return res.status(200).json({
            message: user.name+", You are successfully logged out from all devices",
            userID: user.userID,
        })
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while logging out the User with userID: (${userID} from all devices.User tried this using device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

exports.signOutFromSpecificDevice = async(req,res) => {
    try{
        const user = req.user;
        if(!user){
            return throwInvalidResourceError(res,"UserID");
        }
        let device = getDeviceByID(user,req.deviceID)
        if(!device){
            return throwInvalidResourceError(res,"Device ID");
        }
        // ✅ Now Check if User is Already Logged In
        const result = await checkUserIsNotVerified(user,res);
        if(result){
            logWithTime(`🚫 Request Denied: User (${user.userID}) is already logged out from device ID: (${req.deviceID}). User tried this using device ID: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: "User is already logged out from all devices.",
                suggestion: "Please login first before trying to logout again."
            });
        }
        // Check if User is Logged in on this Single Device  
        if(user.devices.length === 1){ 
            // If yes then isVerified is changed to False
            user.lastLogout = Date.now();
            user.refreshToken = null;
            user.isVerified = false;
            res.clearCookie("refreshToken", { httpOnly: httpOnly, secure: secure, sameSite: sameSite });
        }
        user.devices = user.devices.filter(item => item.deviceID !== req.deviceID);
        await user.save();
        if (user.isBlocked) {
            logWithTime(`⚠️ Blocked user ${user.userID} attempted to logout from device id: ${req.deviceID}.`);
            return throwBlockedAccountError(res); // ✅ Don't proceed if blocked
        }
        else logWithTime(`📤 User (${user.userID}) signed out from device: ${req.deviceID}`);
        // Update data into auth.logs
        await logAuthEvent(req, "LOGOUT_SPECIFIC_DEVICE", { performedOn: user });  
        return res.status(200).json({
            success: true,
            message: "Successfully signed out from the specified device."
        });

    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while logging in the User with userID: (${userID}) on device having device ID: (${req.deviceID})`);
        errorMessage(err)
        return throwInternalServerError(res);        
    }
}

// Logic to activate user account
exports.activateUserAccount = async(req,res) => {
    try{
        const user = req.foundUser;
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(!isPasswordValid){
            return throwInvalidResourceError(res,"Password");
        }
        user.isActive = true;
        user.lastActivatedAt = Date.now();
        await user.save();
        // Activation success log
        logWithTime(`✅ Account activated for UserID: ${user.userID} from device ID: (${req.deviceID})`);
        // Update data into auth.logs
        await logAuthEvent(req, "ACTIVATE", { performedOn: user });
        await activateAccountLog.save();  
        return res.status(200).json({
            success: true,
            message: "Account activated successfully.",
            suggestion: "Please login to continue."
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while activating the User Account with userID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err)
        errorMessage(err)
        return throwInternalServerError(res);
    }
}

// Logic to deactivate user account
exports.deactivateUserAccount = async(req,res) => {
    try{
        const user = req.user;
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(!isPasswordValid){
            return throwInvalidResourceError(res,"Password");
        }
        user.isActive = false;
        // Forcibly Log Out User when its Account is Deactivated
        user.refreshToken = null;
        user.isVerified = false;
        user.devices.length = 0;
        user.lastLogout = Date.now();
        user.lastDeactivatedAt = Date.now();
        res.clearCookie("refreshToken", { httpOnly: httpOnly, secure: secure, sameSite: sameSite });
        await user.save();
        // Deactivation success log
        logWithTime(`🚫 Account deactivated for UserID: ${user.userID} from device id: (${req.deviceID})`);
        // Update data into auth.logs
        await logAuthEvent(req, "DEACTIVATE", { performedOn: user });
        return res.status(200).json({
            success: true,
            message: "Account deactivated successfully.",
            notice: "You are logged out"
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while deactivating the User Account with userID: (${userID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

exports.changePassword = async(req,res) => {
    try{
        const user = req.user;
        const password = req.body.newPassword;
        user.password = await bcrypt.hash(password, SALT); // Password is Encrypted
        user.refreshToken = null;
        user.isVerified = false;
        user.devices.length = 0;
        user.passwordChangedAt = Date.now();
        user.lastLogout = Date.now();
        await user.save();
        res.clearCookie("refreshToken", { httpOnly: httpOnly, secure: secure, sameSite: sameSite });
        logWithTime(`✅ User Password with userID: (${user.userID}) is changed Succesfully from device id: (${req.deviceID})`);
        // Update data into auth.logs
        await logAuthEvent(req, "CHANGE_PASSWORD", { performedOn: user });  
        return res.status(200).json({
            success: true,
            message: "Your password has been changed successfully."
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while changing the password of User with userID: (${userID}) from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

// Controller to Fetch All Active Devices of a User
exports.getActiveDevices = async (req, res) => {
  try {
    // If Get Request has a User then We have to Extract its Details and give to the Admin
    if(req?.query?.userID || req?.query?.emailID || req?.query?.phoneNumber){
        await fetchUser(req,res);
        if (res.headersSent) return; // If response is returned by fetchUser
    }
    let user;
    if(req.foundUser){
        const isUserCheckedAdmin = isAdminID(req.foundUser.userID);
        if(isUserCheckedAdmin && req.foundUser.userID !== adminID){
            logWithTime(`❌ Admin (${req.user.userID}) attempted to access logs of another admin (${userID})`);
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot access another admin's authentication logs.",
            });
        }
        user = req.foundUser;
    }
    else user = req.user;
    
    if (!Array.isArray(user.devices) || user.devices.length === 0) {
      logWithTime(`📭 No active devices found for User (${user.userID})`);
      return res.status(200).json({
        success: true,
        message: "No active devices found for the user.",
        total: 0,
        devices: []
      });
    }

    // Sort devices by lastUsedAt descending
    const sortedDevices = user.devices.sort(
      (a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
    );

    // Update data into auth.logs
    await logAuthEvent(req, "GET_ACTIVE_DEVICES_LOG", { performedOn: user });
    logWithTime(`📲 Fetched ${sortedDevices.length} active devices for User (${user.userID})`);
    if(req.foundUser){
        // Update data into auth.logs
        getActiveDevicesLog["adminActions"] = {
            targetUserID: user.userID
        }
        logWithTime(`Admin (${req.user.userID}) fetched User (${req.foundUser.userID}) active device sessions from device id: (${req.deviceID})`);
    }
    else logWithTime(`User (${req.user.userID}) fetched its active device sessions from device id: (${req.deviceID})`);
    if(!res.headersSent)return res.status(200).json({
      success: true,
      message: "Active devices fetched successfully.",
      total: sortedDevices.length,
      devices: sortedDevices
    });
  } catch (err) {
    const userID = req?.user?.userID || "UNKNOWN_USER";
    logWithTime(`❌ Internal Error occurred while fetching active devices for userID: (${userID})`);
    if(!res.headersSent)return throwInternalServerError(res);
  }
};

exports.provideUserAccountDetails = async(req,res) => {
    try{
        const user = req.user; 
        if(!user){
            return throwResourceNotFoundError(res,"User");
        }
        const User_Account_Details = {
            "Name": user.name,
            "Customer ID": user.userID,
            "Phone Number": user.phoneNumber,
            "Email ID": user.emailID,
            "Verified": user.isVerified,
            "Last Login Time": user.lastLogin,
            "Account Status": user.isActive ? "Activated" : "Deactivated",
            "Blocked Account": user.isBlocked ? "Yes" : "No"
        }
        if(user.passwordChangedAt)User_Account_Details["Password Changed At"] = user.passwordChangedAt;
        if(user.activatedAt)User_Account_Details["Activated Account At"] = user.activatedAt;
        if(user.deactivatedAt)User_Account_Details["Deactivated Account At"] = user.deactivatedAt;
        if(user.lastLogout)User_Account_Details["Last Logout At"] = user.lastLogout;
        // Update data into auth.logs
        await logAuthEvent(req, "PROVIDE_ACCOUNT_DETAILS", { performedOn: user });
        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User from device ID: (${req.deviceID})`);
        return res.status(200).json({
            message: "Here is User Account Details",
            User_Account_Details
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while fetching the User Profile with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}