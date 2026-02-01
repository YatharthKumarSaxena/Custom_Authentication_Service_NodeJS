const { signOutService } = require("@services/auth/sign-out.service");

// Error Handlers
const {
    throwInternalServerError,
    throwSpecificInternalServerError,
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");

const { signOutSuccessResponse } = require("@/responses/success/index");

const { logWithTime } = require("@utils/time-stamps.util");

const signOut = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const userDevice = req.userDevice;
        const requestId = req.requestId;

        const result = await signOutService(user, device, userDevice, requestId);

        if (!result.success) {
            logWithTime(`❌ Sign-out failed for User (${user.userId}) on device (${device.deviceUUID}): ${result.message}`);
            return throwSpecificInternalServerError(res, `Failed to process sign-out request, please try again later. Reason: ${result.message}`);
        }

        // Clear access token header always
        res.set("x-access-token", "");

        return signOutSuccessResponse(res, user, device, result);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Sign-out fatal error ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { signOut };
