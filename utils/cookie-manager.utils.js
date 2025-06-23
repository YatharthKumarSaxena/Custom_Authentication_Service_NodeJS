const { httpOnly, secure, sameSite } = require("../configs/cookies.config");
const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { expiryTimeOfRefreshToken } = require("../configs/user-id.config");
const { logWithTime } = require("./time-stamps.utils");

// utils/cookie-manager.utils.js

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
        throwInternalServerError(res);
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
        throwInternalServerError(res);
        return false;
    }
};

module.exports = {
    setRefreshTokenCookie: setRefreshTokenCookie,
    clearRefreshTokenCookie: clearRefreshTokenCookie
}