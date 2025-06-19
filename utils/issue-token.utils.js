// Extract the required Module
const jwt = require("jsonwebtoken");
const {secretCode} = require("../configs/user-id.config");
const { logWithTime } = require("./time-stamps.utils");
const { errorMessage } = require("../configs/error-handler.configs");

exports.makeTokenWithMongoID = (mongoID,expiryTimeOfToken) => {
    try {
        const newToken = jwt.sign(
            {
                id: mongoID,          // ✅ required for `findById`
            },
            secretCode,
            { expiresIn: expiryTimeOfToken }
        );
        return newToken;
    } catch (err) {
        logWithTime("`❌ An Internal Error Occurred while creating the token");
        errorMessage(err);
        return null;
    }
};
