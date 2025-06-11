// Extracting required Modules, their functions and values
const {expiryTimeOfJWTtoken} = require("../Configs/userID.config");
const {logWithTime} = require("../Utils/timeStamps.utils");
const {throwInvalidResourceError,throwResourceNotFoundError} = require("../Configs/message.configs");
const UserModel = require("../Models/User.model");

// DRY Principle followed by this Code
const checkUserIsNotVerified = async(user) => {
    if(user.isVerified === false)return true; // SignOut Introduces this Feature
    const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
    const currentTime = Date.now(); // In milli second current time is return
    if(currentTime > tokenIssueTime + expiryTimeOfJWTtoken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
        user.isVerified = false;
        await user.save(); // 👈 Add this line
        return true; // 🧠 session expired, response already sent
    }
    return false; // ✅ token valid, continue execution
}

const helperOfSignIn_Or_SignOut_BodyVerification = async(req,res) =>{
    let user;
    let verifyWith = "";
    let anyResourcePresent = true;
    if(req.body.userID){
        user = await UserModel.findOne({userID: req.body.userID});
        if(user){
            verifyWith = verifyWith+"UserID";
        }
    }else if(req.body.emailID){
        user = await UserModel.findOne({emailID: req.body.emailID});
        if(user){
            verifyWith = verifyWith+"EmailID";
        }
    }else if(req.body.phoneNumber){
        user = await UserModel.findOne({phoneNumber: req.body.phoneNumber});
        if(user){
            verifyWith = verifyWith+"PhoneNumber";
        }
    }else{
        anyResourcePresent = false;
    }
    if(!anyResourcePresent){
        resource = "Phone Number, Email ID or Customer ID (Any One of these field)"
        throwResourceNotFoundError(res,resource);
        return verifyWith;
    }
    if(!user){
        throwInvalidResourceError(res, "Phone Number, Email ID or Customer ID");
    }
    if(user && !user.isActive){
        logWithTime("🚫 Access Denied: Your account is blocked.");
        res.status(403).send({
            message: "Your account has been disabled by the admin.",
            suggestion: "Please contact support."
        });
    }
    // Attach the verified user's identity source and the user object to the request 
    // This prevents redundant DB lookups in the controller and makes downstream logic cleaner and faster
    req.verifyWith = verifyWith;
    req.user = user;
    return verifyWith;
}

module.exports = {
    checkUserIsNotVerified: checkUserIsNotVerified,
    helperOfSignIn_Or_SignOut_BodyVerification: helperOfSignIn_Or_SignOut_BodyVerification
}