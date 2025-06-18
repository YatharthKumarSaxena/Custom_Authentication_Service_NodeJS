/*  
  ✅ This file handles the logic for User Registration and User Login in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const { userRegistrationCapacity,adminUserID,IP_Address_Code,SALT,expiryTimeOfAccessToken,expiryTimeOfRefreshToken } = require("../Configs/userID.config");
const UserModel = require("../Models/User.model");
const CounterModel = require("../Models/ID_Generator.model");
const bcryptjs = require("bcryptjs")
const { throwInvalidResourceError,errorMessage,throwInternalServerError } = require("../Configs/errorHandler.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const { makeTokenWithMongoID } = require("../Utils/issueToken.utils");
const prefixIDforCustomer = require("../Configs/idPrefixes.config").customer;
const { httpOnly,secure,sameSite } = require("../Configs/cookies.config");
const { checkUserExists, getDeviceByID } = require("../Utils/validateRequestBody.utils");
const { checkUserIsNotVerified } = require("../Middlewares/helperMiddlewares");

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
async function increaseCustomerCounter(){
    try{
        const customerCounter = await CounterModel.findOneAndUpdate(
            { _id: "CUS" },
            { $inc: { seq: 1 } },
            { new: true } // This will force Mongo DB to return updated document
            // By Default MongoDB returns old documents even after updation
        );
        return customerCounter.seq;
    }catch(err){
        logWithTime("🛑 An Error Occured in findOneAndUpdate function applied on Customer Counter Document")
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

/*
  ✅ SRP: This function only creates the customer counter if it doesn't exist.
  ✅ Singleton Pattern:
  Ensures only one counter document exists with ID "CUS" — maintaining global user count.
*/

// Creates Customer Counter whose seq value starts with 1 initially
async function createCustomerCounter(){
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
        return throwInternalServerError(res);
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
async function makeUserID(){
    let totalCustomers = 1; // By default as Admin User Already Exists 
    let customerCounter; // To remove Scope Resolution Issue
    try{
        customerCounter = await CounterModel.findOne({_id: "CUS"});
    }catch(err){
        logWithTime("⚠️ An Error Occured while accessing the Customer Counter Document");
        errorMessage(err);
        return;
    }
    if(customerCounter){ // Means Customer Counter Exist so Just increase Counter
        totalCustomers = await increaseCustomerCounter();
    }
    else{ // Means Customer Counter does not exist 
        customerCounter = await createCustomerCounter(); // returns object
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
function signInWithToken(request){
    const user = request.foundUser;
    const verifyWith = request.verifyWith;
    logWithTime(`User is logged in by ${verifyWith}`);
    const token = makeTokenWithMongoID(user._id,expiryTimeOfRefreshToken);
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
    const userExistReason = await checkUserExists(emailID,phoneNumber);
    if(userExistReason !== ""){
        return res.status(400).json({
            message: "User Already Exists with "+userExistReason,
            warning: "Use different Email ID or Phone Number or both based on Message"
        })
    }
    /* 2. Insert the Data in the Users Collection of Mongo DB ecomm_db Database */ 
    let generatedUserID; // To resolve Scope Resolution Issue
    try{
        generatedUserID= await makeUserID(); // Generating Customer ID 
        if (generatedUserID === "") { // Check that Machine can Accept More Users Data or not
            return res.status(507).json({
                message: "User limit reached. Cannot register more users at this time."
            });
        }
    }catch(err){
        logWithTime("⚠️ Error Occured while making the User ID");
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
        address: [request_body.address],
        userID: generatedUserID,
        devices: [device]
    }
    // 🟨 Optional Fields Handling
    if(request_body.gender) {
        User["gender"] = request_body.gender;
    }
    if(request_body.dateOfBirth) {
        User["dateOfBirth"] = new Date(request_body.dateOfBirth); 
    }
    if(request_body.profilePicUrl){
        User["profilePicUrl"] = request_body.profilePicUrl;
    }
    try{
        const user = await UserModel.create(User);
        logWithTime("🟢 User Created Successfully, Registration Successfull");
        const userGeneralDetails = {
            name: user.name,
            emailID: user.emailID,
            userID: user.userID,
            userType: user.userType,
            createdAt: user.createdAt,
            devices: [device]
        }
        const userDisplayDetails = {
            details:"Here is your Basic Profile Details given below:-", 
            name: user.name,
            userID: user.userID,
            emailId: user.emailID,
            phoneNumber: user.phoneNumber,
            address: user.address
        }
        // Refresh Token Generation
        const refreshToken = makeTokenWithMongoID(user._id,expiryTimeOfRefreshToken)
        if(!refreshToken){
            logWithTime("❌ Refresh Token generation failed after successful registration!");
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
        const accessToken = makeTokenWithMongoID(user._id,expiryTimeOfAccessToken);
        // Generate Access Token for User
        res.setHeader("x-access-token", accessToken);
        // Smart signal to frontend that Access token is Refreshed now
        res.setHeader("x-token-refreshed", "true"); 
        res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
        logWithTime("User is successfully logged in on registration!");
        logWithTime("👤 New User Details:- ");
        console.log(userGeneralDetails);
    /* 3. Return the response back to the User */
        return res.status(201).json({
            message: "Congratulations, Your Registration as well as login is Done Successfully :- ",
            userDisplayDetails,
        })
    }catch(err){
        logWithTime("⚠️ Error happened while creating a new User");
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
            logWithTime(`⚠️ Access Denied: User with userID: (${user.userID}) attempted to login on same device (${req.body.device.deviceID})`);
            return res.status(400).json({
                success: false,
                message: "User is already logged in.",
                suggestion: "Please logout first before trying to login again."
            });
        };
        device = createDeviceField(req,res);
        user = req.foundUser;
        // ✅ Now Check if User is Already Logged In
        const result = await checkUserIsNotVerified(user,res);
        if (!result) {
            logWithTime("🚫 Request Denied: User is already logged in.");
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
            const refreshToken = signInWithToken(req);
            if (refreshToken === "") {
                logWithTime("❌ Refresh token generation failed during login");
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
            const accessToken = makeTokenWithMongoID(user._id,expiryTimeOfAccessToken);
            // Generate Access Token for User
            res.setHeader("x-access-token", accessToken);
            // Smart signal to frontend that Access token is Refreshed now
            res.setHeader("x-token-refreshed", "true"); 
            res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
            logWithTime("🔐 User with "+user.userID+" is Successfully logged in");
            return res.status(200).json({
                message: "Welcome "+user.name+", You are successfully logged in",
                userID: user.userID,
            })
        }
        else{
            logWithTime("❌ Incorrect Password")
            return throwInvalidResourceError(res,"Password");
        }
    }catch(err){
        logWithTime("⚠️ Error occurred while logging in the User");
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
        user.devices.length = 0;
        res.clearCookie("refreshToken", { httpOnly: httpOnly, sameSite: sameSite, secure: secure });
        await user.save();
        if (!user.isActive) {
            logWithTime(`⚠️ Blocked user ${user.userID} attempted to logout.`);
            return throwBlockedAccountError(res); // ✅ Don't proceed if blocked
        }
        else logWithTime("🔓 User with "+user.userID+" is Successfully logged out")
        return res.status(200).json({
            message: user.name+", You are successfully logged out",
            userID: user.userID,
        })
    }catch(err){
        logWithTime("⚠️ Error occurred while logging out the User");
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
            logWithTime("🚫 Request Denied: User is already logged out.");
            return res.status(400).json({
                success: false,
                message: "User is already logged out.",
                suggestion: "Please login first before trying to logout again."
            });
        }
        // Check if User is Logged in on this Single Device  
        if(user.devices.length === 1){ 
            // If yes then isVerified is changed to False
            user.isVerified = false;
        }
        user.devices = user.devices.filter(item => item.deviceID !== req.deviceID);
        await user.save();
        logWithTime(`📤 User (${user.userID}) signed out from device: ${req.deviceID}`);
        return res.status(200).json({
            success: true,
            message: "Successfully signed out from the specified device."
        });

    }catch(err){
        logWithTime("⚠️ Error occurred while activating the User Account");
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
        await user.save();
        // Activation success log
        logWithTime(`✅ Account activated for UserID: ${user.userID}`);
        return res.status(200).json({
            success: true,
            message: "Account activated successfully.",
            suggestion: "Please login to continue."
        });
    }catch(err){
        logWithTime("⚠️ Error occurred while activating the User Account");
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
        user.lastDeactivatedAt = Date.now();
        res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "Strict" });
        await user.save();
        // Deactivation success log
        logWithTime(`🚫 Account deactivated for UserID: ${user.userID}`);
        return res.status(200).json({
            success: true,
            message: "Account deactivated successfully.",
            notice: "You are logged out"
        });
    }catch(err){
        logWithTime("⚠️ Error occurred while deactivating the User Account");
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
        await user.save();
        res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "Strict" });
        return res.status(200).json({
            success: true,
            message: "Your password has been changed successfully."
        });
    }catch(err){
        logWithTime(`⚠️ Error occurred while changing the password of User with User ID (${req.user.userID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}