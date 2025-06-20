// Extract the required Module
const jwt = require("jsonwebtoken");
const {secretCode,expiryTimeOfAccessToken,expiryTimeOfRefreshToken} = require("../configs/user-id.config");
const { logWithTime } = require("./time-stamps.utils");
const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const AuthLogsModel = require("../models/auth-logs.model");

exports.makeTokenWithMongoID = async(req,res,expiryTimeOfToken) => {
    try {
        const user = req.user;
        const mongoID = user._id;
        const newToken = jwt.sign(
            {
                id: mongoID,          // ✅ required for `findById`
            },
            secretCode,
            { expiresIn: expiryTimeOfToken }
        );
        const tokenCategory = (expiryTimeOfToken === expiryTimeOfRefreshToken)? "REFRESH_TOKEN": "ACCESS_TOKEN";
        const tokenAuthLog = await AuthLogsModel.create({
            userID: req.user.userID,
            eventType: tokenCategory,
            deviceID: req.deviceID,
            performedBy: user.userType
        });
        if(req.deviceName)tokenAuthLog["deviceName"] = req.deviceName;
        await tokenAuthLog.save();
        logWithTime(`✅ (${tokenCategory}) successfully created for user: ${user.userID}. Request is made from deviceID: (${req.deviceID})`);
        return newToken;
    } catch (err) {
        logWithTime("`❌ An Internal Error Occurred while creating the token");
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
};
