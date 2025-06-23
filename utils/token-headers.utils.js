const { logWithTime } = require("./time-stamps.utils");

const setAccessTokenHeaders = (res, accessToken) => {
    if (!res || res.headersSent) {
        logWithTime("⚠️ Cannot set access token headers — response already sent or invalid res object");
        return false;
    }
    // Setting Access Token in headers
    res.setHeader("x-access-token", accessToken);
    // Smart signal to frontend that Access token is Refreshed now
    res.setHeader("x-token-refreshed", "true");
    res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
    logWithTime(`🔐 Access Token headers set successfully`);
    return true;
};

module.exports = {
    setAccessTokenHeaders
};
