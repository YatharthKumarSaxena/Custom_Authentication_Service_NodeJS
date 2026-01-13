const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwBadRequestError } = require("@/utils/error-handler.util");
const { OK } = require("@/configs/http-status.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { forgotPasswordService } = require("@services/password-management/forgot-password.service");

/** 🔐 Handle Forgot Password Request */
const forgotPassword = async (req, res) => {
    try {
        const foundUser = req.foundUser;

        // ✅ Saara kaam Service karegi (Check, Generate, Send)
        const result = await forgotPasswordService(foundUser, req.deviceId);

        // 📝 Logging
        logAuthEvent(req, AUTH_LOG_EVENTS.FORGOT_PASSWORD_REQUEST,
            `User ID ${foundUser.id} requested reset via ${result.contactMode}. Type: ${result.type}`, null);

        logWithTime(`✅ Forgot Password initiated for User ID: ${foundUser.id}`);
        
        // 📢 Response Message Build
        const responses = [];
        if (result.email) responses.push("Email sent");
        if (result.phone) responses.push("SMS sent");

        return res.status(OK).json({
            success: true,
            message: `Password reset initiated. ${responses.join(" & ")}.`
        });

    } catch (err) {
        logWithTime(`❌ Error in forgotPassword controller: ${err.message}`);
        
        // Agar Service ne "Already sent" wala error diya hai to 400 Bad Request bhejo
        if (err.message && (err.message.includes("already") || err.message.includes("valid"))) {
             return throwBadRequestError(res, err.message);
        }

        return throwInternalServerError(res, err);
    }
};

module.exports = {
    forgotPassword
};