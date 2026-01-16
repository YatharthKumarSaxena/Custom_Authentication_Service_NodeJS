// Extract the required Module
const jwt = require("jsonwebtoken");
const { secretCodeOfAccessToken, secretCodeOfRefreshToken, expiryTimeOfRefreshToken } = require("@configs/token.config");
const { logWithTime } = require("./time-stamps.util");
const { Token } = require("@configs/enums.config");

const getTokenCategory = (expiryTimeOfToken) => {
    return (expiryTimeOfToken === expiryTimeOfRefreshToken) ? Token.REFRESH : Token.ACCESS;
}

const createToken = (userId, expiryTime, deviceUUID) => {
    const secret =
        expiryTime === expiryTimeOfRefreshToken
            ? secretCodeOfRefreshToken
            : secretCodeOfAccessToken;

    const token = jwt.sign(
        {
            uid: userId,          // user identity
            did: deviceUUID,   // device identity
        },
        secret,
        { expiresIn: expiryTime }
    );

    const category = getTokenCategory(expiryTime);
    logWithTime(`✅ ${category} created for ${userId}, device: ${deviceUUID}`);

    return token;
};

module.exports = {
    createToken
};