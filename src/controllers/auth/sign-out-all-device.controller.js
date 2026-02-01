// Extracting the required modules
const { throwSpecificInternalServerError, throwInternalServerError, getLogIdentifiers } = require("@/responses/common/error-handler.response");
const { signOutAllDevicesSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");

const signOutAllDevices = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const requestId = req.requestId;

        // 1. Service Call
        const isUserLoggedOut = await logoutUserCompletely(user, device, requestId);

        // 2. Handle Failure 
        if (!isUserLoggedOut) {
            return throwSpecificInternalServerError(res, "Failed to process logout request, please try again later.");
        }

        // 3. Extract correct identifiers 
        res.set('x-access-token', '');
        
        return signOutAllDevicesSuccessResponse(res, user, device);

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while logging out the User ${getIdentifiers}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { 
    signOutAllDevices
};