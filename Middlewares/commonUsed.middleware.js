// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const logWithTime = require("./timeStampsFunctions.config").logWithTime;
const { throwAccessDeniedError, throwBlockedAccountError, errorMessage, throwInternalServerError, throwResourceNotFoundError, throwInvalidResourceError} = require("./message.configs");
const {secretCode,adminID,adminUser,expiryTimeOfJWTtoken} = require("./userID.config");
const { makeToken } = require("../Utils/issueToken.utils");

// Checking User is Blocked 
isUserBlocked = async(req,res) => {
    try{
        let userID = req.body.userID;
        if(!userID){ // Get request has no body 
        userID = req.query.userID;
        }
        if(!userID){ // If User ID not Present
            logWithTime("Access Denied as no User ID provided");
            throwResourceNotFoundError(res,"User ID");
            return true;
        }
        if(userID === adminID){
            // Attached complete admin details with request, save time for controller
            req.user = adminUser;
            return false; // Admin can never be blocked
        }
        else{
            const user = await UserModel.findOne({userID: userID});
            if(!user){
                logWithTime("Invalid User ID entered by you");
                throwInvalidResourceError(res,"UserID");
                return true;
            }
            if(!user.isActive)return true;
            // Attached complete user details with request, save time for controller
            req.user = user;
            return false;
        }
    }catch(err){
        logWithTime("An Error occurred while checking User is blocked or not");
        errorMessage(err);
        throwInternalServerError(res);
        return true;
    }
}

// DRY Principle followed by this Code
function checkUserIsNotVerified(res,user){
    const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
    const currentTime = Date.now(); // In milli second current time is return
    if(currentTime > tokenIssueTime + expiryTimeOfJWTtoken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
        user.isVerified = false;
        logWithTime("⏰ Session expired. Please log in again to continue accessing your account.");
        res.status(401).send({
            success: false,
            message: "⏰ Session expired. Please log in again to continue accessing your account.",
            code: "TOKEN_EXPIRED"
        })
        return true; // 🧠 session expired, response already sent
    }
    return false; // ✅ token valid, continue execution
}

// Check that User is Verified or Not
// Act as middleware for verifyToken and isAdmin function
const checkUserIsVerified = async(req,res) => {
    const result = await isUserBlocked(req,res);
    if(result){
        throwBlockedAccountError(res);
        return false;
    }
    const userID = req.user.userID;
    if(userID === adminID){
        const result = checkUserIsNotVerified(res,adminUser);
        if(result)return;
        adminUser.isVerified = true;
        return true;
    }else{
        try{
            const user = req.user;
            if(!user){
                logWithTime("Please enter a valid userid");
                throwInvalidResourceError(res,"User ID");
                return false;
            }
            const result = checkUserIsNotVerified(res,user);
            if(result)return;
            user.isVerified = true;
            return true;
        }catch(err){
            logWithTime("⚠️ An Error Occurred while finding the User in isVerified Validation");
            errorMessage(err);
            throwInternalServerError(res);
            return false;
        }
    }
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
            // If User is admin itself skip DB Call Reduces Latency Time
            if (decoded.id === adminID) {
                const isVerified = await checkUserIsVerified(req,res);
                if(!isVerified)return;
                adminUser.jwtTokenIssuedAt = Date.now();
                logWithTime("✅ Admin token verified without DB call");
                await adminUser.save();
                return next();
            }
            const isVerified = await checkUserIsVerified(req,res);
            if(!isVerified)return;
            const user = req.user;
             // 🆕 Always refresh token here
            const newToken = makeToken(user.userID);
            if(!newToken)return; // If token not found just return
            user.jwtTokenIssuedAt = Date.now();
            await user.save();
            logWithTime("✅ User with "+decoded.id+" token is verified");
            res.setHeader("x-refreshed-token", `Bearer ${newToken}`);
            next();
        }catch(err){
            logWithTime("⚠️ An Error occurred while verifying the JWT token provided in request");
            errorMessage(err);
            return throwInternalServerError(res);
        }
    })
}

// Checking Provided Request is given by admin or not
const isAdmin = (req,res,next) => {
    const userID = req.user.userID;
    if(userID === adminID)next(); // Checking Provided User ID matches with Admin ID
    else{
        // Admin not present, access denied
        logWithTime("Access Denied: User is not Admin");
        return res.status(403).send({ message: "Access Denied: Admins only" });
    }
}
