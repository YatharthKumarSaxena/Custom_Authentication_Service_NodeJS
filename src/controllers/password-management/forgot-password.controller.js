const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError } = require("@/utils/error-handler.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { VerificationPurpose, ContactModes } = require("@configs/enums.config"); // ContactModes import karna padega
const { forgotPasswordSecurity } = require("@configs/security.config");
const { OK } = require("@/configs/http-status.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");

/** 🔐 Handle Forgot Password Request */
const forgotPassword = async (req, res) => {
    try {
        const foundUser = req.foundUser;

        // 1️⃣ Decide which contact methods to use
        const { email, phone, contactMode } = getUserContacts(foundUser);

        // 2️⃣ Generate verification (OTP / Link) for the purpose
        const verificationResult = await generateVerificationForUser(
            foundUser, 
            req.deviceId, 
            VerificationPurpose.FORGOT_PASSWORD, 
            contactMode, 
            forgotPasswordSecurity.MAX_ATTEMPTS, 
            forgotPasswordSecurity.LINK_EXPIRY_MINUTES * 60
        );

        // Agar generation fail hua (null return aaya)
        if (!verificationResult) {
             return throwInternalServerError(res, { message: "Unable to generate verification token." });
        }

        const { type, token } = verificationResult; // Destructure type and token

        // 3️⃣ Collect response messages & Trigger Utilities
        const responses = [];

        // Logic check based on Contact Mode, not verificationResult properties
        if (contactMode === ContactModes.EMAIL && email) {
            // TODO: Call Email Utility Here
            // await sendEmail(email, type, token); 
            responses.push(`Email sent with ${type === 'LINK' ? 'reset link' : 'OTP'}`);
        } 
        else if (contactMode === ContactModes.PHONE && phone) {
            // TODO: Call SMS Utility Here
            // await sendSMS(phone, token);
            responses.push("OTP sent to phone");
        }

        // 4️⃣ Log the Event
        logAuthEvent(req, AUTH_LOG_EVENTS.FORGOT_PASSWORD_REQUEST,
            `User with ID ${foundUser.id} initiated forgot password process via ${contactMode}. Type: ${type}`, null);

        // 5️⃣ Final Response
        return res.status(OK).json({
            success: true,
            message: `Password reset initiated. ${responses.join(" & ")}.`
        });

    } catch (err) {
        logWithTime(`❌ Internal Error occurred while processing forget password for User deviceId: (${req.deviceId})`);
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    forgotPassword
};