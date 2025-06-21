/*  
  ✅ This file handles the logic for User Registration and User Login in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const { userRegistrationCapacity,adminUserID,IP_Address_Code,SALT,expiryTimeOfAccessToken,expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const UserModel = require("../models/user.model");
const AuthLogModel = require("../models/auth-logs.model");
const CounterModel = require("../models/id-generator.model");
const bcryptjs = require("bcryptjs")
const { throwInvalidResourceError,errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { makeTokenWithMongoID } = require("../utils/issue-token.utils");
const prefixIDforCustomer = require("../configs/id-prefixes.config").customer;
const { httpOnly,secure,sameSite } = require("../configs/cookies.config");
const { checkUserExists, getDeviceByID, checkThresholdExceeded } = require("../utils/auth.utils");
const { checkUserIsNotVerified } = require("../middlewares/helper.middleware");
const { customerIDPrefix } = require("../configs/id-prefixes.config");

/*
  ✅ Single Responsibility Principle (SRP): 
  This function only handles the responsibility of incrementing the user counter.
  ✅ Singleton Pattern:
  Operates on a single MongoDB document (id = "CUS"), treating it as a unique entity.
*/

const checkPasswordIsValid = async(req,user) => {
    const providedPassword = req.body.password;
    const actualPassword = user.password;
    const isPasswordValid = await bcryptjs.compare(providedPassword, actualPassword);
    return isPasswordValid;
}

const createDeviceField = (req,res) => {
    try{
        const device = {
            deviceID: req.deviceID,
            addedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        if(req.deviceName)device.deviceName = req.deviceName;
        return device;
    }catch(err){
        logWithTime(`🛑 An Error Occured in making the Device Field during SignUp/SignIn for user having userID: (${req.body.userID})`)
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

// Increases the value of seq field in Customer Counter Document to generate unique ID for the new user
const increaseCustomerCounter = async(res) => {
    try{
        const customerCounter = await CounterModel.findOneAndUpdate(
            { _id: customerIDPrefix },
            { $inc: { seq: 1 } },
            { new: true } // This will force Mongo DB to return updated document
            // By Default MongoDB returns old documents even after updation
        );
        return customerCounter.seq;
    }catch(err){
        logWithTime("🛑 An Error Occured in findOneAndUpdate function applied on Customer Counter Document")
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

/*
  ✅ SRP: This function only creates the customer counter if it doesn't exist.
  ✅ Singleton Pattern:
  Ensures only one counter document exists with ID "CUS" — maintaining global user count.
*/

// Creates Customer Counter whose seq value starts with 1 initially
const createCustomerCounter = async(res) => {
// Create Customer Counter Document with seq value 1 
    try{
        const customerCounter = await CounterModel.create({
            _id: prefixIDforCustomer,
            seq: 1
            // totalCustomers is by default 1 taken so not need to reassign same value
        });
        return customerCounter;
    }catch(err){
        logWithTime("⚠️ An Error Occured while creating Customer Counter")
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    } 
}

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
        if(!customerCounter)return "";
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

/* Logic to Return JWT Token to the User */
const signInWithToken = async(req,res) => {
    const verifyWith = req.verifyWith;
    logWithTime(`User is logged in by ${verifyWith}`);
    const token = await makeTokenWithMongoID(req,res,expiryTimeOfRefreshToken);
    return token || "";
}

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
        const registerLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "REGISTER",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)registerLog["deviceName"] = req.deviceName;
        await registerLog.save();
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
        const loginLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "LOGIN",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)loginLog["deviceName"] = req.deviceName;
        await loginLog.save();
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
            // Update data into auth.logs
            const loginLog = await AuthLogModel.create({
                userID: user.userID,
                eventType: "LOGIN",
                deviceID: req.deviceID,
                performedBy: user.userType
            });
            if(req.deviceName)loginLog["deviceName"] = req.deviceName;
            await loginLog.save();
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
        const logoutLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "LOGOUT_ALL_DEVICE",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)logoutLog["deviceName"] = req.deviceName;
        await logoutLog.save();    
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
        const logoutLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "LOGOUT_SPECIFIC_DEVICE",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)logoutLog["deviceName"] = req.deviceName;
        await logoutLog.save();   
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
        user.activatedAt = Date.now();
        await user.save();
        // Activation success log
        logWithTime(`✅ Account activated for UserID: ${user.userID} from device ID: (${req.deviceID})`);
        // Update data into auth.logs
        const activateAccountLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "ACTIVATE",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)activateAccountLog["deviceName"] = req.deviceName;
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
        const deactivateAccountLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "DEACTIVATE",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)deactivateAccountLog["deviceName"] = req.deviceName;
        await deactivateAccountLog.save(); 
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
        const changePasswordLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "CHANGED_PASSWORD",
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)changePasswordLog["deviceName"] = req.deviceName;
        await changePasswordLog.save();     
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
    if(req.foundUser)user = req.foundUser;
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
    const getActiveDevicesLog = await AuthLogModel.create({
        userID: req.user.userID,
        eventType: "GET_ACTIVE_DEVICES_LOG",
        deviceID: req.deviceID,
        performedBy: req.user.userType,
    });
    if(req.deviceName)getActiveDevicesLog["deviceName"] = req.deviceName; 
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
        const provideAccountDetailsLog = await AuthLogModel.create({
            userID: req.user.userID,
            eventType: "PROVIDE_ACCOUNT_DETAILS",
            deviceID: req.deviceID,
            performedBy: req.user.userType,
        });        
        await provideAccountDetailsLog.save();
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