// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const { logWithTime } = require("../Utils/timeStamps.utils");
const { throwAccessDeniedError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError} = require("../Configs/message.configs");
const {secretCode,adminID} = require("../Configs/userID.config");
const { makeTokenByUserID } = require("../Utils/issueToken.utils");
const {checkUserIsNotVerified} = require("./helperMiddlewares");

// ✅ Checking if User Account is Active
const isUserAccountActive = async(req,res,next) => {
    try{
        let userID = req?.user?.userID || req?.body?.userID || req?.query?.userID;
        if(userID === adminID){ // Admin Account can never be deactivated
            // Very next line should be:
            if (!res.headersSent) return next();
        }
        let user = req.user;
        if(user.isActive === false){
            logWithTime(`🚫 Access Denied: User Account (${user.userID}) is Deactivated.`);
            res.status(403).send({
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
        let userID = req.foundUserID;
        if(!userID) userID = req.body.userID;
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
            const user = await UserModel.findOne({userID: userID});
            if(!user){
                logWithTime("Invalid User ID entered by you");
                return throwInvalidResourceError(res,"UserID");
            }
            if(user.isBlocked){
                logWithTime("⚠️ Blocked User Account is denied access whose user id is "+userID);
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
        res.status(401).send({
            success: false,
            message: "⏰ Session expired. Please log in again to continue accessing your account.",
            code: "TOKEN_EXPIRED"
        })
        return;
    }
    // 🆕 Always refresh token here
    const newToken = makeTokenByUserID(user.userID);
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
        return res.status(403).send({
            message: "No token found: ⚠️ Unauthorized"
        })
    }
    // Now Verifying whether the provided JWT Token is valid token or not
    jwt.verify(token,secretCode,async (err,decoded)=>{
        if(err){
            return throwAccessDeniedError(res,"⚠️ UnAuthorized Token Provided !");
        }
        try{
            if (!decoded || !decoded.id) {
                //  Validate Token Payload Strictly
                logWithTime("⚠️ Invalid Malformed token (ID missing) Provided");
                return throwResourceNotFoundError(res,"ID");
            }
            req.foundUserID = decoded.id;
            logWithTime("Valid Token is Provided");
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
    let userID = req?.foundUserID || req?.user?.userID || req?.body?.userID;
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

module.exports = {
    verifyToken: verifyToken,
    isAdmin: isAdmin,
    checkUserIsVerified: checkUserIsVerified,
    isUserBlocked: isUserBlocked,
    isUserAccountActive: isUserAccountActive
}

