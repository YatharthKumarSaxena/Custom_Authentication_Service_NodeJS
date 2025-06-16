// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const { logWithTime } = require("../Utils/timeStamps.utils");
const { throwAccessDeniedError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError} = require("../Configs/errorHandler.configs");
const {secretCode,adminID, expiryTimeOfRefreshToken, expiryTimeOfAccessToken} = require("../Configs/userID.config");
const { makeTokenWithMongoID } = require("../Utils/issueToken.utils");
const {checkUserIsNotVerified, fetchUser} = require("./helperMiddlewares");
const { extractAccessToken, extractRefreshToken } = require("../Utils/extractToken");

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
        logWithTime("⚠️ An Error occurred while checking User Account is active or not");
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
                logWithTime("⚠️ Invalid User ID entered by you");
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
        logWithTime("⚠️ An Error occurred while checking User is blocked or not");
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
                logWithTime("❌ User not found while verifying.");
                return throwResourceNotFoundError(res, "User");
            }
            req.user = user; // 🧷 Attach for future use
        }
        const isNotVerified = await checkUserIsNotVerified(user,res);
        if(isNotVerified){
            logWithTime("⏰ Session expired. Please log in again to continue accessing your account.");
            return res.status(401).json({
                success: false,
                message: "⏰ Session expired. Please log in again to continue accessing your account.",
                code: "TOKEN_EXPIRED"
            })
        }
        // Reset Refresh Token
        const refreshToken = makeTokenWithMongoID(user._id,expiryTimeOfRefreshToken);
        user.refreshToken = refreshToken;
        user.jwtTokenIssuedAt = Date.now();
        res.cookie("id", refreshToken, {
            httpOnly: httpOnly,
            secure: secure,
            sameSite: sameSite,
            maxAge: expiryTimeOfRefreshToken * 1000 // if expiry is in seconds
        });
        await user.save();
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ An Error occurred while checking User is verified or not");
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
    jwt.verify(accessToken,secretCode,async (err,decoded)=>{
        try{
            if (err || !decoded || !decoded.id) { // Means Access Token Provided is found invalid
                const user = req.user;
                const isRefreshTokenInvalid = await checkUserIsNotVerified(user,res);
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
                const accessToken = makeTokenWithMongoID(user._id,expiryTimeOfAccessToken);
                // Set this token in Response Headers
                res.setHeader("x-access-token", accessToken);
                // Smart signal to frontend that Access token is Refreshed now
                res.setHeader("x-token-refreshed", "true"); 
                res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
                if(!res.headersSent)return next();
            }
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

const verifyTokenOwnership = async(req, res, next) => {
  try {
    // 1. Extract refresh token from cookies (assuming 'id' key stores the refresh token)
    const refreshToken = req?.cookies?.id;
    if (!refreshToken) { // if refreshToken Not Found
        logWithTime("⚠️ Refresh Token not provided in Cookies")
        return throwAccessDeniedError(res, "No refresh token provided");
    }
    // 2. Verify refresh token
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // 3. Check Whether Refresh Token Provided is Valid or Not
    const tokenExists = await Token.findOne({ refreshToken: refreshToken }); // or Redis GET
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
        decodedAccess = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        logWithTime("Access token provided is invalid or expired");
        return res.status(403).json({ message: "Invalid access token" });
    }
    // 5. Match both token owners
    if (decodedAccess && decodedAccess.id !== decodedRefresh.id) {
        logWithTime("Token mismatch: Access and Refresh tokens belong to different users");
        return res.status(403).json({ message: "Token mismatch: user identities do not match" });
    }
    // ✅ Tokens are valid and synced – attach user to req
    req.user = decodedRefresh;
    // ✅ All checks passed
    if(!res.headersSent)next();
    } catch (err) {
        logWithTime("⚠️ An Error Occurred while validating the tokens presence and validations")
    errorMessage(err)
    return throwInternalServerError(res);
  }
};

module.exports = {
    verifyToken: verifyToken,
    isAdmin: isAdmin,
    checkUserIsVerified: checkUserIsVerified,
    isUserBlocked: isUserBlocked,
    isUserAccountActive: isUserAccountActive,
    verifyTokenOwnership: verifyTokenOwnership
}