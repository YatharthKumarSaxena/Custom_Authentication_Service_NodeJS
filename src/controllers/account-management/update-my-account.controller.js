const { OK } = require("@configs/http-status.config");
const { updateAccountService } = require("@services/account-management/update-account.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwInvalidResourceError,
    throwConflictError
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");
const { logoutUserCompletely } = require("@/services/auth/auth-session.service");

const updateMyAccount = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;

        const updatePayload = {
            firstName: req.body.firstName,
            email: req.body.email,
            countryCode: req.body.countryCode,
            localNumber: req.body.localNumber
        };

        // 1️⃣ Call service
        const result = await updateAccountService(
            user,
            device,
            updatePayload
        );

        // ❌ Business failure handling
        if (!result.success) {

            // Validation errors
            if (result.type === AuthErrorTypes.INVALID_INPUT) {
                return throwInvalidResourceError(
                    res,
                    "Input",
                    result.message
                );
            }

            // Email / Phone already exists
            if (result.type === AuthErrorTypes.RESOURCE_EXISTS) {
                return throwConflictError(res, result.message);
            }

            // No change is NOT an error
            return res.status(OK).json({
                success: true,
                message: result.message
            });
        }

        // 🔐 Logout if sensitive info changed
        const sensitiveFieldsChanged =
            result.updatedFields.includes("Email") ||
            result.updatedFields.includes("Phone Number");

        if (sensitiveFieldsChanged) {
            logWithTime(
                `🔐 Sensitive account data changed for User ${user.userId}. Logging out all sessions.`
            );

            const isLoggedOut = await logoutUserCompletely(
                user,
                device,
                "Account Update: Email/Phone Change"
            );

            if (isLoggedOut) {
                res.set("x-access-token", "");
            } else {
                logWithTime(
                    `⚠️ Logout failed after sensitive update for User ${user.userId}`
                );
            }
        }

        // ✅ Success response with verification status
        let message = result.message;
        
        // Build dynamic message based on what was updated
        if (result.emailVerificationSent || result.phoneVerificationSent) {
            const verificationMessages = [];
            
            if (result.emailVerificationSent) {
                verificationMessages.push("Verification email sent to your new email address");
            }
            
            if (result.phoneVerificationSent) {
                verificationMessages.push("Verification code sent to your new phone number");
            }
            
            message = `Profile updated successfully. ${verificationMessages.join(". ")}.`;
        }
        
        return res.status(OK).json({
            success: true,
            message,
            updatedFields: result.updatedFields,
            emailVerificationSent: result.emailVerificationSent || false,
            phoneVerificationSent: result.phoneVerificationSent || false
        });

    } catch (err) {
        logWithTime(`❌ Fatal update account error: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { updateMyAccount };
