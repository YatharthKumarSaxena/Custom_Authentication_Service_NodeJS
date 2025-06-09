// Extracting the Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User.model");

// Extracting Required Functions and Values

const logWithTime = require("./timeStampsFunctions.config").logWithTime;
const { errorMessage, throwInternalServerError, throwResourceNotFoundError} = require("./message.configs");
const secretCode = require("./userID.config").secretCode;

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