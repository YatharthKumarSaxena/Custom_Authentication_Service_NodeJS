const { SendNotificationFactory } = require("@services/factories/notification.factory"); 
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { DeviceModel } = require("@models/device.model");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { FRONTEND_ROUTES } = require("@configs/frontend-routes.config");
const { VerificationPurpose, AuthErrorTypes } = require("@configs/enums.config");

const forgotPasswordService = async (user, device) => {

    const { email, phone, contactMode } = getUserContacts(user);
    
    const { deviceUUID, deviceName, deviceType } = device;
    const deviceDoc = await DeviceModel.findOneAndUpdate({
        deviceUUID: deviceUUID
    }, {
        $set: {
            deviceName: deviceName,
            deviceType: deviceType
        }
    }, {
        new: true,
        upsert: true
    });

    // 2️⃣ Generate token
    const verificationResult = await generateVerificationForUser(
        user,
        deviceDoc._id,
        VerificationPurpose.FORGOT_PASSWORD,
        contactMode
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