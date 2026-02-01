const { expiryTimeOfRefreshToken } = require("@configs/token.config"); 
const { logWithTime } = require("@utils/time-stamps.util");
const { httpOnly, sameSite, secure } = require("@configs/cookies.config");
const { errorMessage } = require("@/responses/common/error-handler.response");

const setRefreshTokenCookie = (res, token) => {
    try{
        res.cookie("refreshToken", token, {
            httpOnly: httpOnly,
            sameSite: sameSite,
            secure: secure,
            maxAge: expiryTimeOfRefreshToken
        });
        logWithTime(`🍪 Refresh Token Cookie Set`);
        return true;
    }catch(err){
        logWithTime("An Internal Error occured while setting the Refresh Token in Cookie");
        errorMessage(err);
        return false;
    }
};


const clearRefreshTokenCookie = (res) => {
    try{
        res.clearCookie("refreshToken", {
            httpOnly: httpOnly,
            sameSite: sameSite,
            secure: secure,
            maxAge: expiryTimeOfRefreshToken
        });
        logWithTime(`🧹 Refresh Token Cookie Cleared`);
        return true;
    }catch(err){
        logWithTime("An Internal Error occured while clearing the Refresh Token from Cookie");
        errorMessage(err);
        return false;
    }
};

module.exports = {
    setRefreshTokenCookie: setRefreshTokenCookie,
    clearRefreshTokenCookie: clearRefreshTokenCookie
}
