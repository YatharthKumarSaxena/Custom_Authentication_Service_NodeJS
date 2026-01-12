const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { errorMessage, throwInternalServerError } = require("@utils/error-handler.util");
const { logWithTime } = require("../utils/time-stamps.util");

// DRY Principle followed by this Code
const checkUserIsNotVerified = async(req,res) => {
    try{
        const user = req.user || req.foundUser;
        if(user.isVerified === false)return true; // SignOut Introduces this Feature
        if (!user.jwtTokenIssuedAt) {
            logWithTime(`⚠️ Missing jwtTokenIssuedAt for user (${user.userID}). Logging out as precaution.`);
            const isUserLoggedOut = await logoutUserCompletely(user, res, req, "missing jwtTokenIssuedAt in checkUserIsNotVerified");
            if (isUserLoggedOut) return true;
            return false;
        }
        const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
        const currentTime = Date.now(); // In milli second current time is return
        if(currentTime > tokenIssueTime + expiryTimeOfRefreshToken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
            const isUserLoggedOut = await logoutUserCompletely(user,res,req,"in check user is not verfied function")
            if(isUserLoggedOut)return true;
            return false; // 🧠 session expired, response already sent
        }
        return false; // ✅ token valid, continue execution
    }catch(err){
        logWithTime(`❌ An Internal Error Occurred while verifying the User Request`);
        errorMessage(err);
        throwInternalServerError(res);
        return true;
    }
}

const viewMyAuthLogs = async(req,res) => {
}

module.exports = { 
    viewMyAuthLogs 
}