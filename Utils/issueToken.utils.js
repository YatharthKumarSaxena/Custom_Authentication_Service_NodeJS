// Extract the required Module
const jwt = require("jsonwebtoken");
const {secretCode,expiryTimeOfJWTtoken} = require("../Configs/userID.config");
const { logWithTime } = require("./timeStamps.utils");
const { errorMessage } = require("../Configs/message.configs");

exports.makeTokenWithMongoID = (mongoID) => {
    try {
        const newToken = jwt.sign(
            {
                id: mongoID,          // ✅ required for `findById`
            },
            secretCode,
            { expiresIn: expiryTimeOfJWTtoken }
        );
        return newToken;
    } catch (err) {
        logWithTime("An Error Occurred while creating the token");
        errorMessage(err);
        return null;
    }
};
