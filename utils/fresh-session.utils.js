const { httpOnly,secure,sameSite } = require("../configs/cookies.config");
const { errorMessage,throwInternalServerError} = require("../configs/error-handler.configs");
const { expiryTimeOfRefreshToken,refreshThresholdInMs } = require("../configs/user-id.config");
const { makeTokenWithMongoID } = require("./issue-token.utils"); 
const { logWithTime } = require("./time-stamps.utils");

const resetRefreshToken = async(req,res) => {
    try{
        const user = req.user;
        const now = Date.now();
        const timeSinceLastIssued = now - user.jwtTokenIssuedAt;
        const refreshThreshold = refreshThresholdInMs;
        if (timeSinceLastIssued > refreshThreshold) {
            const refreshToken = makeTokenWithMongoID(user._id, expiryTimeOfRefreshToken);
            user.refreshToken = refreshToken;
            user.jwtTokenIssuedAt = now;
            res.cookie("id", refreshToken, {
                httpOnly: httpOnly,
                secure: secure,
                sameSite: sameSite,
                maxAge: expiryTimeOfRefreshToken * 1000
            });
            await user.save();
            return true;
        }
        return false;
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error occurred reseting refresh token for User (${userID}).Request is made from device id: (${req.deviceID})`);
        errorMessage(err);
        if (!res.headersSent)return throwInternalServerError(res);
    }
}

module.exports = {
    resetRefreshToken: resetRefreshToken
}