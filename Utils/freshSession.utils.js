const { httpOnly,secure,sameSite } = require("../Configs/cookies.config");
const { errorMessage,throwInternalServerError} = require("../Configs/errorHandler.configs");
const { expiryTimeOfRefreshToken } = require("../Configs/userID.config");
const { makeTokenWithMongoID } = require("./issueToken.utils"); 
const { logWithTime } = require("./timeStamps.utils");

const resetRefreshToken = async(req,res) => {
    try{
        const user = req.user;
        const now = Date.now();
        const timeSinceLastIssued = now - user.jwtTokenIssuedAt;
        const refreshThreshold = 2 * 24 * 60 * 60 * 1000; // e.g., rotate only if last token was issued 2 days ago
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
        logWithTime("⚠️ An Error occured while reseting the refresh token ");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    resetRefreshToken: resetRefreshToken
}