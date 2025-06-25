// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { UUID_V4_REGEX } = require("../configs/regex.config");
// Extracting Required Functions and Values

const { logWithTime } = require("../utils/time-stamps.utils");
const { throwAccessDeniedError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError, throwBlockedAccountError } = require("../configs/error-handler.configs");
const { secretCodeOfAccessToken, secretCodeOfRefreshToken, expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const { makeTokenWithMongoID } = require("../utils/issue-token.utils");
const { fetchUser } = require("./helper.middleware");
const { extractAccessToken, extractRefreshToken } = require("../utils/extract-token.utils");
const { resetRefreshToken } = require("../utils/fresh-session.utils");
const { getDeviceByID } = require("../utils/device.utils");
const { DEVICE_TYPES } = require("../configs/user-enums.config");
const { checkUserIsNotVerified } = require("../controllers/auth.controllers");
const { setAccessTokenHeaders } = require("../utils/token-headers.utils");

// ✅ Checking if User Account is Active
const isUserAccountActive = async(req,res,next) => {
    try{
        let user = req.user || req.foundUser;
        if(!user){
            const verifyWith = await fetchUser(req,res);
            if(verifyWith === ""){
                logWithTime(`❌ User not found while checking account active status on device id: (${req.deviceID})`);
                return throwResourceNotFoundError(res, "User");
            }
            req.user = req.foundUser; // 🧷 Attach for future use
            user = req.user;
        }
        if(user.userType === "ADMIN"){ // Admin Account can never be deactivated
            // Very next line should be:
            if (!res.headersSent) return next();
        }
        if(user.isActive === false){
            logWithTime(`🚫 Access Denied: User Account (${user.userID}) is Deactivated on device id: (${req.deviceID})`);
            res.status(403).json({
                success: false,
                message: "Your account is currently deactivated.",
                suggestion: "Please activate your account before continuing."
            });
            return;
        }
        // ✅ Active User – Allow to proceed
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while checking User Account with id: ({${userID}}) is active or not on device id: (${req.deviceID})`);
        errorMessage(err);
        if (!res.headersSent) {
            return throwInternalServerError(res);
        }
    }  
}

// Checking User is Blocked
const isUserBlocked = async(req,res,next) => {
    try{
        let user = req.user || req.foundUser;
        let verifyWith;
        if(!user){
            verifyWith = await fetchUser(req,res);
        }
        if(verifyWith === "")return;
        user = req.foundUser;
        if(user.userType === "ADMIN"){
            if(!res.headersSent)return next();
        }
        else{
            if(user.isBlocked){
                logWithTime(`⚠️ Blocked User Account is denied access whose user id is (${user.userID}) on device id: (${req.deviceID})`);
                return throwBlockedAccountError(req,res);
            };
            // Attached complete user details with request, save time for controller
            req.user = req.foundUser;
            // Very next line should be:
            if (!res.headersSent) return next();
        }
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while checking User with id: ({${userID}}) is blocked or not on device id: (${req.deviceID})`);
        errorMessage(err);
        if (!res.headersSent) {
            return throwInternalServerError(res);
        }
    }
}

// Check that User is Verified or Not
// Act as middleware for verifyToken and isAdmin function
const checkUserIsVerified = async(req,res,next) => {
    try{
        let user = req.user;
        if(!user){
            let userID = req?.user?.userID || req?.body?.userID;
            user = await UserModel.findOne({ userID: userID });
            if (!user) {
                logWithTime(`❌ User not found while verifying on device id: (${req.deviceID}`);
                return throwResourceNotFoundError(res, "User");
            }
            req.user = user; // 🧷 Attach for future use
        }
        const deviceID = req.deviceID;
        // Check whether Device ID belongs to User or Not
        const device = await getDeviceByID(user,deviceID);
        if(!device){
            logWithTime(`⏰ Session expired for User (${user.userID}) on device id: (${req.deviceID})`);
            return throwInvalidResourceError(res,"Device ID");
        }
        const isNotVerified = await checkUserIsNotVerified(req,res);
        if(isNotVerified){
            logWithTime(`⏰ Session expired for User (${user.userID}). Please log in again to continue accessing your account.`);
            return res.status(401).json({
                success: false,
                message: "⏰ Session expired. Please log in again to continue accessing your account.",
                code: "TOKEN_EXPIRED"
            })
        }
        
        const currentTime = Date.now();
        const lastUsedTime = new Date(device.lastUsedAt).getTime();
        const expiryWindow = expiryTimeOfRefreshToken * 1000; // convert to ms

        if (currentTime - lastUsedTime > expiryWindow) {
            user.devices = user.devices.filter(d => d.deviceID !== req.deviceID);
            await user.save();
            logWithTime(`🔒 Session expired for user (${user.userID}) on device (${req.deviceID})`);
            return res.status(440).json({
                success: false,
                message: "Your session on this device has expired. Please login again to continue."
            });
        }
        // Reset Refresh Token
        const isRefreshTokenReset = await resetRefreshToken(req,res);
        if(isRefreshTokenReset){
            logWithTime(`🔄 Refresh token rotated for userID: ${req.user.userID} from device id: (${req.deviceID})`);
            user.jwtTokenIssuedAt = Date.now();
            await user.save();
        }
        // ✅ 3. Update lastUsedAt
        device.lastUsedAt = Date.now();
        await user.save(); // Ensure it's persisted
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while checking User with id: ({${userID}}) is verified or not on device id: (${req.deviceID})`);
        errorMessage(err);
        if (!res.headersSent) {
            return throwInternalServerError(res);
        }
    }
}

// Logic to Verify Token and Update jwtTokenIssuedAt time
const verifyToken = (req,res,next) => {
    const accessToken = extractAccessToken(req);
    if(!accessToken){
        logWithTime("❌ No Access Token provided")
        return res.status(403).json({
            message: "No token found: ⚠️ Unauthorized"
        })
    }
    // Now Verifying whether the provided JWT Token is valid token or not
    jwt.verify(accessToken,secretCodeOfAccessToken,async (err,decoded)=>{
        try{
            let user = req.user;
            if (err || !decoded || !decoded.id) { // Means Access Token Provided is found invalid           
                const isRefreshTokenInvalid = await checkUserIsNotVerified(req,res);
                if(isRefreshTokenInvalid){
                    //  Validate Token Payload Strictly
                    logWithTime(`⚠️ Access Denied, User with userID: (${user.userID}) is logged out`);
                    return res.status(403).send({
                        message: "Access Denied to perform action",
                        reason: "You are not logged in, please login to continue"
                    });
                }
                if(res.headersSent)return;
                // Logic to generate new access token
                const newAccessToken = await makeTokenWithMongoID(req,res,expiryTimeOfAccessToken);
                // Set this token in Response Headers
                const isAccessTokenSet = setAccessTokenHeaders(res,newAccessToken);
                if(!isAccessTokenSet){
                    logWithTime(`❌ Access token set in header failed for User (${user.userID}) at the time of token verification. Request is made from device id: (${req.deviceID})`);
                    return throwInternalServerError(res);
                }
                if(!res.headersSent)return next();
            }
            logWithTime("✅ Token Validated and User Fetched");
            // Very next line should be:
            if (!res.headersSent) return next();
        }catch(err){
            const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
            logWithTime(`❌ An Internal Error Occurred while checking User with id: ({${userID}) to verify its JWT token `);
            errorMessage(err);
            return throwInternalServerError(res);
        }
    })
}

// Checking Provided Request is given by admin or not
const isAdmin = (req,res,next) => {
    const user = req.user;
    if (!user) {
        logWithTime(`❌ Access Denied: No user information found while checking admin access on device id: (${req.deviceID})`);
        return throwAccessDeniedError(res, "User not authenticated");
    }
    if(user.userType === "ADMIN"){
        // Very next line should be:
        if (!res.headersSent) return next(); // Checking Provided User ID matches with Admin ID
    }
    else{
        // Admin not present, access denied
        logWithTime(`Access Denied: User (${req.user.userID}) is not Admin on device id: (${req.deviceID})`);
        return throwAccessDeniedError(res,"Admins only");
    }
}

const verifyTokenOwnership = async(req, res, next) => {
    try {
        // 1. Extract refresh token from cookies (assuming 'token' key stores the refresh token)
        const refreshToken = extractRefreshToken(req);
        if (!refreshToken) { // if refreshToken Not Found
            logWithTime("⚠️ Refresh Token not provided in Cookies")
            return throwAccessDeniedError(res, "No refresh token provided");
        }
        // 2. Verify refresh token
        const decodedRefresh = jwt.verify(refreshToken, secretCodeOfRefreshToken);
        // 3. Check Whether Refresh Token Provided is Valid or Not
        const tokenExists = await UserModel.findOne({ refreshToken: refreshToken }); // or Redis GET
        if (!tokenExists) {
            logWithTime("Access Denied as Invalid Refresh Token is being provided");
            return throwAccessDeniedError(res,"Invalid Refresh Token");
        }
        // 4. Extract Access token
        const accessToken = extractAccessToken(req);
        if(!accessToken){
            logWithTime("❌ No Access Token provided")
            return res.status(403).json({
                message: "No token found: ⚠️ Unauthorized"
            })
        }
        let decodedAccess;
        try {
            decodedAccess = jwt.verify(accessToken, secretCodeOfAccessToken);
        } catch (err) {
            logWithTime("Access token provided is invalid or expired");
            return res.status(403).json({ message: "Invalid access token" });
        }
        // 5. Match both token owners
        if (decodedAccess && decodedAccess.id !== decodedRefresh.id) {
            logWithTime("Token mismatch: Access and Refresh tokens belong to different users");
            return res.status(403).json({ message: "Token mismatch: user identities do not match" });
        }
        // 🔍  Find user from DB
        const user = await UserModel.findById(decodedRefresh.id);
        // ✅ Tokens are valid and synced – attach user to req
        req.user = user;
        if (!user) {
            logWithTime("User not found in DB for decoded token ID");
            return throwResourceNotFoundError(res, "User");
        }
        // ✅ All checks passed
        if(!res.headersSent)next();
        } catch (err) {
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while checking User with id: ({${userID}) to verify its JWT token ownership `);
        errorMessage(err)
        return throwInternalServerError(res);
    }
};

const verifyDeviceField = async (req,res,next) => {
    try{
        const deviceID = req.headers["x-device-uuid"];
        const deviceName = req.headers["x-device-name"]; // Optional
        const deviceType = req.headers["x-device-type"]; // Optional
        // Device ID is mandatory
        if (!deviceID || deviceID.trim() === "") {
            return throwResourceNotFoundError(res, "Device UUID (x-device-uuid) is required in request headers");
        }
        // Attach to request object for later use in controller
        req.deviceID = deviceID.trim();
        if (!UUID_V4_REGEX.test(req.deviceID)) {
            return throwInvalidResourceError(res, `Provided Device UUID (${req.deviceID}) is not in a valid UUID v4 format`);
        }
        if (deviceName && deviceName.trim() !== "") {
            req.deviceName = deviceName.trim();
        }
        if (deviceType && deviceType.trim() !=="" ) {
            const type = deviceType.toUpperCase().trim();
            if (!DEVICE_TYPES.includes(type)) {
                return throwInvalidResourceError(res, `Invalid Device Type: ${deviceType}`);
            }
            req.deviceType = type;
        }
        if(!res.headersSent)next(); // Pass control to the next middleware/controller
    }catch(err){
        logWithTime(`⚠️ Error occurred while validating the Device field of User (${req.user.userID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySetAdminCookieBody = async(req,res,next) => {
    try{
        if(!req.body){
            logWithTime(`⚠️ Access Denied as no body prvided for Admin to set up cookie from device id : (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        const refreshToken = req.body.refreshToken;
        if(!refreshToken){
            logWithTime(`⚠️ Access Denied as Refresh Token not provided by Admin to set up cookie from device id : (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Refresh Token");
        }
        const user = await UserModel.findOne({refreshToken: refreshToken});
        if(!user){
            logWithTime(`⚠️ Access Denied as Invalid Refresh Token provided by Admin to set up cookie from device id : (${req.deviceID})`)
            return throwInvalidResourceError(res,"User");
        }
        // Check Provided Access Token Or Not
        const accessToken = extractAccessToken(req);
        if(!accessToken){
            logWithTime(`⚠️ Access Denied to Set Cookie for Admin as no access token provided. Request is made from device id: (${req.deviceID})`);
            return throwResourceNotFoundError(res, "Access Token");
        }
        let decodedAccess;
        try {
            decodedAccess = jwt.verify(accessToken, secretCodeOfAccessToken);
        } catch (err) {
            logWithTime(`⚠️ Access token provided is invalid or expired.So Access Denied for Set up Admin Cookie. Request is made from device id: (${req.deviceID})`);
            return res.status(403).json({ message: "Invalid access token" });
        }
        // Checks Access Token And Refresh Token Belongs to the Same User
        if(decodedAccess.id !== String(user._id)){
            logWithTime(`⚠️ Access token and Refresh Token does not belong to same user. So Access Denied for Set up Admin Cookie. Request is made from device id: (${req.deviceID})`)
            return res.status(403).json({ message: "Tokens belong to different users" }); 
        }
        // Check Access Token belongs to Admin Or Not
        req.user = user;
        if(!res.headersSent)return next();
    }catch(err){
        logWithTime(`⚠️ Error occurred while validating the set admin cookie body , made from device id: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
};

module.exports = {
    verifyToken: verifyToken,
    isAdmin: isAdmin,
    checkUserIsVerified: checkUserIsVerified,
    isUserBlocked: isUserBlocked,
    isUserAccountActive: isUserAccountActive,
    verifyTokenOwnership: verifyTokenOwnership,
    verifyDeviceField: verifyDeviceField,
    verifySetAdminCookieBody: verifySetAdminCookieBody
}