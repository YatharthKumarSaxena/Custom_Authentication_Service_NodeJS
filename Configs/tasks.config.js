// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const logWithTime = require("./timeStampsFunctions.config").logWithTime;
const { errorMessage, throwInternalServerError, throwResourceNotFoundError} = require("./message.configs");
const {secretCode,adminID,adminUser} = require("./userID.config").secretCode;

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
            return res.status(401).send({
                message: "⚠️ UnAuthorized Token Provided !"
            })
        }
        try{
            if (!decoded || !decoded.id) {
                //  Validate Token Payload Strictly
                logWithTime("⚠️ Invalid Malformed token (ID missing) Provided");
                return throwResourceNotFoundError(res,"ID");
            }
            // If User is admin itself skip DB Call Reduces Latency Time
            if (decoded.id === adminID) {
                // Attach Admin in User to Reduce DB calls
                req.user = adminUser;
                logWithTime("✅ Admin token verified without DB call");
                return next();
            }
            const user = await UserModel.findOne({userID: decoded.id})
            if(!user){
                logWithTime("⚠️ Invalid User Provided");
                return throwResourceNotFoundError(res,"User");
            }
            // Attached complete user details with request , save time for controller
            req.user = user;
            logWithTime("✅ User with "+decoded.id+" token is verified");
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
    const userID = req.user.userID; // Fetching user ID from request body
    if(!userID){ // If User ID not Present
        logWithTime("Access Denied as no User ID provided");
        return throwResourceNotFoundError(res,"User ID");
    }
    if(userID === adminID)next(); // Checking Provided User ID matches with Admin ID
    else{
        // Admin not present, access denied
        logWithTime("Access Denied: User is not Admin");
        return res.status(403).send({ message: "Access Denied: Admins only" });
    }
}