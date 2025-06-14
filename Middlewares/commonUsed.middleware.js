// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const { logWithTime } = require("../Utils/timeStamps.utils");
const { throwAccessDeniedError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError} = require("../Configs/errorHandler.configs");
const {secretCode,adminID} = require("../Configs/userID.config");
const { makeTokenWithMongoID } = require("../Utils/issueToken.utils");
const {checkUserIsNotVerified, fetchUser} = require("./helperMiddlewares");

// ✅ Checking if User Account is Active
const isUserAccountActive = async(req,res,next) => {
    try{
        let userID = req?.user?.userID  || req?.foundUser?.userID || req?.body?.userID || req?.query?.userID;
        if(userID === adminID){ // Admin Account can never be deactivated
            // Very next line should be:
            if (!res.headersSent) return next();
        }
        let user = req.user;
        if(!user){
            user = await UserModel.findOne({userID: userID});
            if(!user){
                logWithTime("❌ User not found while checking account active status");
                return throwResourceNotFoundError(res, "User");
            }
            req.user = user; // 🧷 Attach for future use
        }
        if(user.isActive === false){
            logWithTime(`🚫 Access Denied: User Account (${user.userID}) is Deactivated.`);
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
        logWithTime("An Error occurred while checking User Account is active or not");
        errorMessage(err);
        if (!res.headersSent) {
            return throwInternalServerError(res);
        }
    }  
}

// Checking User is Blocked
const isUserBlocked = async(req,res,next) => {
    try{
        let userID;
        userID = req?.user?.userID;
        if(!userID) userID = req.body.userID;
        if(!userID && req.foundUser) userID = req.foundUser.userID;
        if(!userID){ // Get request has no body 
            userID = req.query.userID;
        }
        if(!userID){ // If User ID not Present
            logWithTime("⚠️ Access Denied as no User ID provided");
            return throwResourceNotFoundError(res,"User ID");
        }
        if(userID === adminID){
            return next(); // Admin can never be blocked
        }
        else{
            let user = req.foundUser || req.user;
            if(!user)user = await UserModel.findOne({userID: userID});
            if(!user){
                logWithTime("Invalid User ID entered by you");
                return throwInvalidResourceError(res,"UserID");
            }
            if(user.isBlocked){
                logWithTime("⚠️ Blocked User Account is denied access whose user id is "+user.userID);
                throwAccessDeniedError(res,"⚠️ Blocked User Account Provided !")
                return;
            };
            // Attached complete user details with request, save time for controller
            req.user = user;
            // Very next line should be:
            if (!res.headersSent) return next();
        }
    }catch(err){
        logWithTime("An Error occurred while checking User is blocked or not");
        errorMessage(err);
        if (!res.headersSent) {
            return throwInternalServerError(res);
        }
    }
}

// Check that User is Verified or Not
// Act as middleware for verifyToken and isAdmin function
const checkUserIsVerified = async(req,res,next) => {
    let user = req.user;
    if(!user){
        let userID = req?.user?.userID || req?.body?.userID;
        user = await UserModel.findOne({ userID: userID });
        if (!user) {
            logWithTime("❌ User not found while verifying.");
            return throwResourceNotFoundError(res, "User");
        }
        req.user = user; // 🧷 Attach for future use
    }
    const isNotVerified = await checkUserIsNotVerified(user);
    if(isNotVerified){
        logWithTime("⏰ Session expired. Please log in again to continue accessing your account.");
        res.status(401).json({
            success: false,
            message: "⏰ Session expired. Please log in again to continue accessing your account.",
            code: "TOKEN_EXPIRED"
        })
        return;
    }
    // Check Access Token Validity
    // 🆕 If Access Token Expired Generate a new Access Token for it
    const newToken = makeTokenWithMongoID(user._id);
    if(!newToken)return; // If token not found just return
    user.jwtTokenIssuedAt = Date.now();
    await user.save();
    logWithTime("✅ User with "+user.userID+" token is verified");
    res.setHeader("x-refreshed-token", `Bearer ${newToken}`);
    // Very next line should be:
    if (!res.headersSent) return next();
}

// Logic to Verify Token and Update jwtTokenIssuedAt time
const verifyToken = (req,res,next) => {
    //🔐 Bearer Token Handling	✅ Added	Supports frontend standards, avoids malformed headers.
    const authHeader = req.headers["authorization"] || req.headers["x-access-token"]; // Check if the token is present in the Header
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    if(!token){ // Means Token is not Present
        return res.status(403).json({
            message: "No token found: ⚠️ Unauthorized"
        })
    }
    // Now Verifying whether the provided JWT Token is valid token or not
    jwt.verify(token,secretCode,async (err,decoded)=>{
        try{
            if (err || !decoded || !decoded.id) { // Means Access Token Provided is found invalid
                // If Refresh Token is Valid then generate new Access token
                const refreshToken = req?.cookies?.refreshToken;
                if (!refreshToken) {
                    logWithTime("⚠️ Refresh Token not provided in Cookies")
                    return throwAccessDeniedError(res, "No refresh token provided");
                }
                // Fetch User by JWT Token
                const user = await UserModel.findOne({refreshToken: refreshToken});
                if(!user){
                    logWithTime("⚠️ Invalid Refresh Token provided in Cookies")
                    return throwAccessDeniedError(res, "Invalid refresh token provided");
                }
                const isRefreshTokenInvalid = await checkUserIsNotVerified(user);
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
                const accessToken = await makeTokenWithMongoID(user._id);
                // Set this token in Response Headers
                req.user = user;
                res.setHeader("x-access-token", accessToken);
                // Smart signal to frontend that Access token is Refreshed now
                res.setHeader("x-token-refreshed", "true"); 
                res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
                if(!res.headersSent)return next();
            }
            const user = await UserModel.findById(decoded.id);
            if (!user) {
                return throwResourceNotFoundError(res, "User");
            }
            req.user = user; // 🔥 Attach user object to request
            logWithTime("✅ Token Validated and User Fetched");
            // Very next line should be:
            if (!res.headersSent) return next();
        }catch(err){
            logWithTime("⚠️ An Error occurred while verifying the JWT token provided in request");
            errorMessage(err);
            return throwInternalServerError(res);
        }
    })
}

// Checking Provided Request is given by admin or not
const isAdmin = (req,res,next) => {
    let userID = req?.user?.userID || req?.body?.userID;
    if(userID === adminID){
        // Very next line should be:
        if (!res.headersSent) return next(); // Checking Provided User ID matches with Admin ID
    }
        else{
        // Admin not present, access denied
        logWithTime("Access Denied: User is not Admin");
        return throwAccessDeniedError(res,"Admins only");
    }
}

// Validate Provided UserID and Token User ID are same or not
const validateUserIDMatch = async (req, res, next) => {
    try{
        const verifyWith = await fetchUser(req,res);
        if(!req.foundUser){
            logWithTime("❌ User not found during ID validation");
            return;
        }
        const providedUserID = String(req.foundUser._id);
        if(!providedUserID || req.user.id !== providedUserID){
            logWithTime(`⚠️ User ID mismatch: tokenUserID(${req.user.userID}) vs request(${verifyWith}) whose user id is (${req.foundUser.userID})`);
            return res.status(403).json({ message: "User ID mismatch: Access Denied" });
        }
        if(!res.headersSent)return next();
    }catch(err){
        logWithTime("⚠️ An Error Occurred while validating the Provided User and User Obtained from Token")
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
    validateUserIDMatch: validateUserIDMatch
}

