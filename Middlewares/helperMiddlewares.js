// Extracting required Modules, their functions and values
const {expiryTimeOfRefreshToken} = require("../Configs/userID.config");
const {throwInvalidResourceError,throwResourceNotFoundError,throwInternalServerError,errorMessage} = require("../Configs/errorHandler.configs");
const UserModel = require("../Models/User.model");
const { logWithTime } = require("../Utils/timeStamps.utils");

// DRY Principle followed by this Code
const checkUserIsNotVerified = async(user,res) => {
    try{
        if(user.isVerified === false)return true; // SignOut Introduces this Feature
        const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
        const currentTime = Date.now(); // In milli second current time is return
        if(currentTime > tokenIssueTime + expiryTimeOfRefreshToken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
            user.isVerified = false;
            user.refreshToken = null;
            user.devices.length = 0;
            res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "Strict" });
            await user.save(); // 👈 Add this line
            return true; // 🧠 session expired, response already sent
        }
        return false; // ✅ token valid, continue execution
    }catch(err){
        logWithTime(`❌ An Internal Error Occurred while verifying the User Request`);
        errorMessage(err);
        throwInternalServerError(res);
        return true;
    }
}

const fetchUser = async(req,res) =>{
    try{
        let user;
        let verifyWith = "";
        let anyResourcePresent = true;
        const getID = req?.query?.userID || req?.user?.userID; // For the Get Request
        if(getID){
            user = await UserModel.findOne({userID: getID});
            if(user){
                verifyWith = verifyWith+"UserID";
            }
        }
        else if(req.body.userID){
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
            const resource = "Phone Number, Email ID or Customer ID (Any One of these field)"
            throwResourceNotFoundError(res,resource);
            return verifyWith;
        }
        if(!user){
            throwInvalidResourceError(res, "Phone Number, Email ID or Customer ID");
            return verifyWith;
        }
        // Attach the verified user's identity source and the user object to the request 
        // This prevents redundant DB lookups in the controller and makes downstream logic cleaner and faster
        req.verifyWith = verifyWith;
        req.foundUser = user;
        return verifyWith;
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while fetching the User Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

module.exports = {
    checkUserIsNotVerified: checkUserIsNotVerified,
    fetchUser: fetchUser
}