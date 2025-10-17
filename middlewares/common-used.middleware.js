// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { UUID_V4_REGEX } = require("../configs/regex.config");
// Extracting Required Functions and Values

const { logWithTime } = require("../utils/time-stamps.utils");
const { throwAccessDeniedError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError, throwBlockedAccountError, getLogIdentifiers, logMiddlewareError } = require("../configs/error-handler.configs");
const { secretCodeOfAccessToken, secretCodeOfRefreshToken, expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const { makeTokenWithMongoID } = require("../utils/issue-token.utils");
const { fetchUser } = require("./helper.middleware");
const { extractAccessToken, extractRefreshToken } = require("../utils/extract-token.utils");
const { resetRefreshToken } = require("../utils/fresh-session.utils");
const { getDeviceByID } = require("../utils/device.utils");
const { DEVICE_TYPES } = require("../configs/user-enums.config");
const { checkUserIsNotVerified } = require("../controllers/auth.controllers");
const { setAccessTokenHeaders } = require("../utils/token-headers.utils");
const {  FORBIDDEN, LOGIN_TIMEOUT } = require("../configs/http-status.config");
const { validateLength, isValidRegex } = require("../utils/field-validators");
const { deviceNameLength } = require("../configs/fields-length.config");

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
            res.status(FORBIDDEN).json({
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
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while checking User Account is active or not ${getIdentifiers}`);
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
        if(!user){
            const verifyWith = await fetchUser(req,res);
            if(verifyWith === ""){
                logMiddlewareError("Is User Blocked, Unauthorized or Invalid User Identifier", req);
                return;
            }
            else {
                // Attached complete user details with request, save time for controller
                user = req.foundUser;
                req.user = req.foundUser;
            }
        }
        if(user.userType === "ADMIN"){
            if(!res.headersSent)return next();
        }
        else{
            if(user.isBlocked){
                logWithTime(`⚠️ Blocked User Account is denied access whose user id is (${user.userID}) on device id: (${req.deviceID})`);
                return throwBlockedAccountError(req,res);
            };
            // Very next line should be:
            if (!res.headersSent) return next();
        }
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while checking User is blocked or not ${getIdentifiers}`);
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
                logMiddlewareError("Check Verified User, No user found using provided identifier", req);
                return throwResourceNotFoundError(res, "User");
            }
            req.user = user; // 🧷 Attach for future use
        }
        const deviceID = req.deviceID;
        // Check whether Device ID belongs to User or Not
        const device = await getDeviceByID(user,deviceID);
        if(!device){
            logMiddlewareError("Check Verified User, Device ID not found or does not belong to user", req);
            return throwInvalidResourceError(res,"Device ID");
        }
        const isNotVerified = await checkUserIsNotVerified(req,res);
        if(isNotVerified){
            logWithTime(`⏰ Session expired for User (${user.userID}). Please log in again to continue accessing your account.`);
            return res.status(FORBIDDEN).json({
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
            return res.status(LOGIN_TIMEOUT).json({
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
        else { 
            logMiddlewareError("Check Verified User, Refresh Token could not be rotated", req);
        }
        // ✅ 3. Update lastUsedAt
        device.lastUsedAt = Date.now();
        await user.save(); // Ensure it's persisted
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while checking User is verified or not ${getIdentifiers}`);
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
        logMiddlewareError("Verify Token , Access Token not found",req);
        return throwResourceNotFoundError(res,"Access Token");
    }
    // Now Verifying whether the provided JWT Token is valid token or not
    jwt.verify(accessToken,secretCodeOfAccessToken,async (err,decoded)=>{
        try{
            let user = req.user;
            if (err || !decoded || !decoded.id) { // Means Access Token Provided is found invalid  
                if (!user) {
                    // Try extracting from refreshToken again (defensive fallback)
                    const refreshToken = extractRefreshToken(req);
                    const decodedRefresh = jwt.verify(refreshToken, secretCodeOfRefreshToken);
                    user = await UserModel.findById(decodedRefresh.id);
                    req.user = user;
                }         
                const isRefreshTokenInvalid = await checkUserIsNotVerified(req,res);
                if(isRefreshTokenInvalid){
                    //  Validate Token Payload Strictly
                    logWithTime(`⚠️ Access Denied, User with userID: (${user.userID}) is logged out`);
                    return res.status(FORBIDDEN).send({
                        success: false,
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
            logWithTime(`✅ Token Validated and User Fetched for device ID: ${req.deviceID}`);
            // Very next line should be:
            if (!res.headersSent) return next();
        }catch(err){
            const getIdentifiers = getLogIdentifiers(req);
            logWithTime(`❌ An Internal Error Occurred while verifying access token ${getIdentifiers}`);
            errorMessage(err);
            return throwInternalServerError(res);
        }
    })
}

// Checking Provided Request is given by admin or not
const isAdmin = (req,res,next) => {
    try{
        const user = req.user;
        if (!user) {
            logMiddlewareError("Is Admin, No user info present in request", req);
            return throwAccessDeniedError(res, "User");
        }
        if(user.userType === "ADMIN"){
            // Very next line should be:
            if (!res.headersSent) return next(); // Checking Provided User ID matches with Admin ID
        }
        else{
            // Admin not present, access denied
            logMiddlewareError(`Is Admin, Access Denied for non-admin user: (${user.userID})`, req);
            return throwAccessDeniedError(res,"Admin, Admins only");
        }
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while checking User is Admin or not ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyTokenOwnership = async(req, res, next) => {
    try {
        // 1. Extract refresh token from cookies (assuming 'token' key stores the refresh token)
        const refreshToken = extractRefreshToken(req);
        if (!refreshToken) { // if refreshToken Not Found
            logMiddlewareError(`Verify Token Ownnership,Refresh Token Missing in Cookies`, req);
            return throwResourceNotFoundError(res, "Refresh token");
        }
        // 2. Verify refresh token
        let decodedRefresh;
        try{
            decodedRefresh = jwt.verify(refreshToken, secretCodeOfRefreshToken);
        }catch(err){
            logWithTime(`⚠️ Decoded Refresh Token lacks user ID. Device: (${req.deviceID})`);
            return throwInvalidResourceError(res, "Refresh token");
        }
        // 3. Check Whether Refresh Token Provided is Valid or Not
        const tokenExists = await UserModel.findOne({ refreshToken: refreshToken }); // or Redis GET
        if (!tokenExists) {
            logWithTime(`⚠️ Stale Refresh Token detected. User: (${decodedRefresh.id}) | Device: (${req.deviceID})`);
            return throwAccessDeniedError(res, "Stale Refresh Token");
        }
        // 4. Extract Access token
        const accessToken = extractAccessToken(req);
        if(!accessToken){
            req.user = tokenExists;
            logMiddlewareError(`Verify Token Ownership, Access Token Field Missing`, req);
            return throwResourceNotFoundError(res, "Access token");
        }
        let decodedAccess;
        try {
            decodedAccess = jwt.verify(accessToken, secretCodeOfAccessToken);
        } catch (err) {
        if (err.name === "TokenExpiredError") {
            logWithTime("⚠️ Access token is expired, passing control to next middleware");
            if (!res.headersSent) return next(); // ✅ Let next middleware handle it
        }
        logWithTime("❌ Access token is invalid");
        return throwInvalidResourceError(res, "Access Token");
        }
        // 5. Match both token owners
        if (decodedAccess && String(decodedAccess.id) !== String(decodedRefresh.id)) {
            logWithTime("Token mismatch: Access and Refresh tokens belong to different users");
            return throwAccessDeniedError(res,"Access and Refresh tokens belong to different users");
        }
        // 🔍  Find user from DB
        const user = await UserModel.findById(decodedRefresh.id);
        if (!user) {
            logMiddlewareError(`Verify Access Token, Unauthorized User Provided from Refresh Token`, req);
            return throwResourceNotFoundError(res, "User");
        }
        // ✅ Tokens are valid and synced – attach user to req
        req.user = user;
        // ✅ All checks passed
        if(!res.headersSent)next();
        } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying token ownership ${getIdentifiers}`);
        errorMessage(err)
        return throwInternalServerError(res);
    }
};

const verifyDeviceField = async (req,res,next) => {
    try{
        const deviceID = req.headers["x-device-uuid"];
        let deviceName = req.headers["x-device-name"]; // Optional
        const deviceType = req.headers["x-device-type"]; // Optional
        // Device ID is mandatory
        if (!deviceID || deviceID.trim() === "") {
            logWithTime("Verify Device Field, Device ID field Missing");
            return throwResourceNotFoundError(res, "Device UUID (x-device-uuid) is required in request headers");
        }
        // Attach to request object for later use in controller
        req.deviceID = deviceID.trim();
        if (!isValidRegex(deviceID,UUID_V4_REGEX)) {
            logMiddlewareError("Verify Device Field, Invalid Device ID format",req);
            return throwInvalidResourceError(res, `Device UUID, Provided Device UUID (${req.deviceID}) is not in a valid UUID v4 format`);
        }
        if (deviceName && deviceName.trim() !== "") {
            deviceName = deviceName.trim();
            if(!validateLength(deviceName,deviceNameLength.min,deviceNameLength.max)){
                logMiddlewareError(`Verify Device Field, Invalid Device Name length.`,req);
                return throwAccessDeniedError(res, `Device Name length should be between ${deviceNameLength.min} and ${deviceNameLength.max} characters`);
            }
        }
        if (deviceType && deviceType.trim() !=="") {
            const type = deviceType.toUpperCase().trim();
            if (!DEVICE_TYPES.includes(type)) {
                logMiddlewareError("Verify Device Field, Invalid Device Type Provided",req);
                return throwInvalidResourceError(res, `Device Type. Use Valid Device Type: ${DEVICE_TYPES}`);
            }
            req.deviceType = type;
        }
        if(!res.headersSent)next(); // Pass control to the next middleware/controller
    }catch(err){
        const deviceID = req.headers["x-device-uuid"] || "Unauthorized Device ID"
        logWithTime(`⚠️ Error occurred while validating the Device field having device id: ${deviceID}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySetAdminCookieBody = async(req,res,next) => {
    try{
        if(!req.body || Object.keys(req.body).length === 0){
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
            return throwInvalidResourceError(res,"Access token");
        }
        // Checks Access Token And Refresh Token Belongs to the Same User
        if(String(decodedAccess.id) !== String(user._id)){
            logWithTime(`⚠️ Access token and Refresh Token does not belong to same user. So Access Denied for Set up Admin Cookie. Request is made from device id: (${req.deviceID})`)
            return throwAccessDeniedError(res,"Access and Refresh tokens belong to different users"); 
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