const { makeTokenWithMongoID } = require("../utils/issue-token.utils");
const { logWithTime } = require("../utils/time-stamps.utils");
const { expiryTimeOfRefreshToken } = require("../configs/user-id.config");

exports.signInWithToken = async (req, res) => {
    const verifyWith = req.verifyWith;
    logWithTime(`User logged in using ${verifyWith}`);
    const token = await makeTokenWithMongoID(req, res, expiryTimeOfRefreshToken);
    return token || "";
}
