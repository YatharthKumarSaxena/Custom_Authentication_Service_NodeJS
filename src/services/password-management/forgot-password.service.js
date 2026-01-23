const { SendNotificationFactory } = require("@services/factories/notification.factory"); 
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");

const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { FRONTEND_ROUTES } = require("@configs/frontend-routes.config");
const { VerifyMode, VerificationPurpose, ContactModes, AuthErrorTypes } = require("@configs/enums.config");
const { verificationSecurity } = require("@configs/security.config")

const forgotPasswordService = async (user, deviceId) => {

    const { email, phone, contactMode } = getUserContacts(user);

    const expectedType =
        contactMode === ContactModes.SMS
            ? VerifyMode.OTP
            : VerifyMode.LINK;

    // 1️⃣ Re-send protection
    const canSend = await CheckExistingTokenFactory(
        user._id,
        expectedType,
        VerificationPurpose.FORGOT_PASSWORD
    );

    if (!canSend) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_SENT,
            message:
                expectedType === VerifyMode.OTP
                    ? "A valid OTP is already sent. Please check your SMS."
                    : "A reset link is already sent. Please check your Email."
        };
    }

    const forgotPasswordSecurity = verificationSecurity[VerificationPurpose.FORGOT_PASSWORD];
    
    // 2️⃣ Generate token
    const verificationResult = await generateVerificationForUser(
        user,
        deviceId,
        VerificationPurpose.FORGOT_PASSWORD,
        contactMode,
        forgotPasswordSecurity.MAX_ATTEMPTS,
        forgotPasswordSecurity.LINK_EXPIRY_MINUTES * 60
    );

    if (!verificationResult) {
        return {
            success: false,
            type: AuthErrorTypes.GENERATION_FAILED,
            message: "Unable to generate reset token. Please try again later."
        };
    }

    const { type, token } = verificationResult;

    // 3️⃣ Send notification
    const isSent = await SendNotificationFactory(
        user,
        contactMode,
        token,
        type,
        userTemplate.forgotPassword,
        userSmsTemplate.forgotPassword,
        FRONTEND_ROUTES.RESET_PASSWORD
    );

    if (!isSent) {
        return {
            success: false,
            type: AuthErrorTypes.NOTIFICATION_FAILED,
            message: "Failed to send reset instructions. Please try again."
        };
    }

    return {
        success: true,
        email,
        phone,
        contactMode,
        type
    };
};

module.exports = { forgotPasswordService };