// Extract the required Module
const jwt = require("jsonwebtoken");
const {secretCodeOfAccessToken, secretCodeOfRefreshToken, expiryTimeOfRefreshToken} = require("../configs/user-id.config");
const { logWithTime } = require("./time-stamps.utils");
const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logAuthEvent, adminAuthLogForSetUp } = require("../utils/auth-log-utils");
const getTokenCategory = (expiryTimeOfToken) =>{
    return (expiryTimeOfToken === expiryTimeOfRefreshToken)? "REFRESH_TOKEN": "ACCESS_TOKEN";
}

exports.makeTokenWithMongoID = async(req,res,expiryTimeOfToken) => {
    try {
        const user = req.user;
        const mongoID = user._id;
        const secretCode = (expiryTimeOfToken === expiryTimeOfRefreshToken)? secretCodeOfRefreshToken: secretCodeOfAccessToken;
        const newToken = jwt.sign(
            {
                id: mongoID,          // ✅ required for `findById`
            },
            secretCode,
            { expiresIn: expiryTimeOfToken }
        );
        const tokenCategory = getTokenCategory(expiryTimeOfToken);
        // Update data into auth.logs
        await logAuthEvent(req, tokenCategory, null);
        logWithTime(`✅ (${tokenCategory}) successfully created for user: ${user.userID}. Request is made from deviceID: (${req.deviceID})`);
        return newToken;
    } catch (err) {
        logWithTime("`❌ An Internal Error Occurred while creating the token");
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
};

exports.makeTokenWithMongoIDForAdmin = async(user,expiryTimeOfToken) => {
    try {
        const mongoID = user._id;
        const secretCode = (expiryTimeOfToken === expiryTimeOfRefreshToken)? secretCodeOfRefreshToken: secretCodeOfAccessToken;
        const newToken = jwt.sign(
            {
                id: mongoID,          // ✅ required for `findById`
            },
            secretCode,
            { expiresIn: expiryTimeOfToken }
        );
        const tokenCategory = getTokenCategory(expiryTimeOfToken);
        // Update data into auth.logs
        await adminAuthLogForSetUp(user, tokenCategory);
        logWithTime(`✅ (${tokenCategory}) successfully created for user: ${user.userID}. Request is made from deviceID: (${user.devices[0].deviceID})`);
        return newToken;
    } catch (err) {
        logWithTime("`❌ An Internal Error Occurred while creating the token for Admin");
        errorMessage(err);
        return null;
    }
};

