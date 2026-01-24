const { SendNotificationFactory } = require("@services/factories/notification.factory");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { DeviceModel } = require("@models/device.model");

const { AuthErrorTypes, VerificationPurpose } = require("@configs/enums.config");
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


    if (purpose === VerificationPurpose.EMAIL_VERIFICATION && user.isEmailVerified) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_VERIFIED,
            message: "Email already verified. Verification is no longer required."
        };
    }
    
    if (purpose === VerificationPurpose.PHONE_VERIFICATION && user.isPhoneVerified) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_VERIFIED,
            message: "Phone already verified. Verification is no longer required."
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

    // 🔑 SINGLE SOURCE OF TRUTH
    const verificationResult = await generateVerificationForUser(
        user,
        deviceDoc._id,   // ✅ correct ObjectId
        purpose,
        contactMode
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
        `SEND_${purpose}`,
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
