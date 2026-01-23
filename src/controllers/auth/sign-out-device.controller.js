// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { signOutService } = require("@services/auth/sign-out.service");

// Error Handlers
const {
    throwInternalServerError,
    throwSpecificInternalServerError,
    getLogIdentifiers
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");

const signOut = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const userDevice = req.userDevice;

        const result = await signOutService(user, device, userDevice);

        if (!result.success) {
            logWithTime(`❌ Sign-out failed for User (${user.userId}) on device (${device.deviceUUID}): ${result.message}`);
            return throwSpecificInternalServerError(res, `Failed to process sign-out request, please try again later. Reason: ${result.message}`);
        }

        // Clear access token header always
        res.set("x-access-token", "");

        logWithTime(
            `👋 Sign-out processed for User (${user.userId}) on device (${device.deviceUUID})`
        );

        return res.status(OK).json({
            success: true,
            message: result.message,
            sessionExpired: result.sessionExpired || false
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Sign-out fatal error ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { signOut };
