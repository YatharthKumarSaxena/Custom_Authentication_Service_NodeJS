const { SendNotificationFactory } = require("@services/factories/notification.factory");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { DeviceModel } = require("@models/device.model");

const { AuthErrorTypes } = require("@configs/enums.config");
const { verificationSecurity } = require("@configs/security.config");
const { VerificationTemplateMapping } = require("@configs/verification-mapping.config");

const resendVerificationService = async (user, device, purpose) => {

    const { contactMode } = getUserContacts(user);

    const config = VerificationTemplateMapping[purpose];
    if (!config) {
        return {
            success: false,
            type: AuthErrorTypes.INVALID_PURPOSE,
            message: "Invalid verification purpose."
        };
    }

    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: device.deviceUUID },
        {
            $set: {
                deviceName: device.deviceName,
                deviceType: device.deviceType
            }
        },
        { new: true, upsert: true }
    );

    const security = verificationSecurity[purpose];

    // 🔑 SINGLE SOURCE OF TRUTH
    const verificationResult = await generateVerificationForUser(
        user,
        deviceDoc._id,   // ✅ correct ObjectId
        purpose,
        contactMode,
        security.MAX_ATTEMPTS,
        security.LINK_EXPIRY_MINUTES * 60
    );

    if (!verificationResult) {
        return {
            success: false,
            type: AuthErrorTypes.GENERATION_FAILED,
            message: "Failed to generate verification token."
        };
    }

    // ⛔ ACTIVE OTP / LINK EXISTS
    if (verificationResult.reused === true) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_SENT,
            message: "A valid verification already exists. Please wait before requesting again."
        };
    }

    // 📩 SEND NOTIFICATION
    const isSent = await SendNotificationFactory(
        user,
        contactMode,
        verificationResult.token,
        verificationResult.type,
        config.emailTemplate,
        config.smsTemplate,
        config.route
    );

    if (!isSent) {
        return {
            success: false,
            type: AuthErrorTypes.NOTIFICATION_FAILED,
            message: "Failed to send verification message."
        };
    }

    logAuthEvent(
        user,
        device,
        "RESEND_VERIFICATION",
        `Resent ${verificationResult.type} for ${purpose} via ${contactMode}.`,
        null
    );

    return {
        success: true,
        type: verificationResult.type,
        contactMode
    };
};

module.exports = { resendVerificationService };
