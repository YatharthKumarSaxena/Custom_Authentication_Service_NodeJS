const { errorMessage,throwInternalServerError, getLogIdentifiers} = require("../configs/error-handler.configs");
const { expiryTimeOfRefreshToken,refreshThresholdInMs } = require("../configs/user-id.config");
const { makeTokenWithMongoID } = require("./issue-token.utils"); 
const { logWithTime } = require("./time-stamps.utils");
const { setRefreshTokenCookie } = require("./cookie-manager.utils");

const resetRefreshToken = async(req,res) => {
    try{
        const user = req.user;
        const now = Date.now();
        const timeSinceLastIssued = now - user.jwtTokenIssuedAt;
        const refreshThreshold = refreshThresholdInMs;
        if (timeSinceLastIssued > refreshThreshold) {
            const refreshToken = await makeTokenWithMongoID(req,res,expiryTimeOfRefreshToken);
            const isCookieSet = setRefreshTokenCookie(res,refreshToken);
            if(!isCookieSet){
                logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the reset refresh token function. Request is made from device ID: (${req.deviceID})`);
                return;
            }
            user.refreshToken = refreshToken;
            user.jwtTokenIssuedAt = Date.now();
            await user.save();
            return true;
        }
        return false;
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error occurred reseting refresh token ${getIdentifiers}`);
        errorMessage(err);
        if (!res.headersSent)return throwInternalServerError(res);
    }
}

module.exports = {
    resetRefreshToken: resetRefreshToken
}