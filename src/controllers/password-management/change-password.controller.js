const bcryptjs = require("bcryptjs");
const { SALT } = require("@configs/bcrypt.config");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@/services/auth-session.service");
const { checkPasswordIsValid } = require("@/utils/auth.util");
const { logAuthEvent } = require("@/utils/auth-log-util");
const { throwBadRequestError, throwInvalidResourceError, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");

const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { newPassword, confirmPassword, password } = req.body;
        let isPasswordValid = await checkPasswordIsValid(user.userId, password);
        if (!isPasswordValid) {
            return throwInvalidResourceError(res, "Password");
        }
        if (newPassword !== confirmPassword) {
            logWithTime(`❌ Confirm Password does not match with New Password for User ${getLogIdentifiers(req)}`);
            return throwBadRequestError(res, "Confirm Password does not match with New Password");
        }
        user.password = await bcryptjs.hash(newPassword, SALT);
        user.passwordChangedAt = Date.now();
        await user.save();
        const isUserLoggedOut = await logoutUserCompletely(user, req, res, "log out from all device request due to Password Change");
        if (!isUserLoggedOut) {
            return res.status(OK).json({
                success: true,
                message: "Password updated successfully. However, logout from all devices failed. Please ensure to log out from other sessions manually."
            });
        }
        logWithTime(`✅ User Password with userId: (${user.userId}) is changed Succesfully from device id: (${req.deviceId})`);
        // Update data into auth.logs
        logAuthEvent(req, AUTH_LOG_EVENTS.CHANGE_PASSWORD, null);
        return res.status(OK).json({
            success: true,
            message: "Your password has been changed successfully. You have been logged out from all devices. Please log in again with your new password."
        });
    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while changing the password of User ${getIdentifiers}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    changePassword
}