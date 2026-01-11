// Extract the required Module
const jwt = require("jsonwebtoken");
const { secretCodeOfAccessToken, secretCodeOfRefreshToken, expiryTimeOfRefreshToken } = require("@configs/token.config");
const { logWithTime } = require("./time-stamps.util");
const { Token } = require("@configs/enums.config");

const getTokenCategory = (expiryTimeOfToken) => {
    return (expiryTimeOfToken === expiryTimeOfRefreshToken) ? Token.REFRESH : Token.ACCESS;
}

const createToken = (userId, expiryTime, deviceId) => {
    const secret =
        expiryTime === expiryTimeOfRefreshToken
            ? secretCodeOfRefreshToken
            : secretCodeOfAccessToken;

    const token = jwt.sign(
        {
            uid: userId,          // user identity
            did: deviceId,   // device identity
        },
        secret,
        { expiresIn: expiryTime }
    );

    const category = getTokenCategory(expiryTime);
    logWithTime(`✅ ${category} created for ${userId}, device: ${deviceId}`);

    return { token, category };
};

module.exports = {
    createToken
};