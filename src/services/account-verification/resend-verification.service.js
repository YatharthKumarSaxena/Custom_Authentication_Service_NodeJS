const { CheckExistingTokenFactory } = require("@services/factories/token-check.factory");
const { SendNotificationFactory } = require("@services/factories/notification.factory"); 
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { logAuthEvent } = require("@utils/auth-log-util");

const { VerifyMode, ContactModes } = require("@configs/enums.config");
const { verificationSecurity } = require("@configs/security.config");
const { VerificationTemplateMapping } = require("@configs/verification-mapping.config");

const resendVerificationService = async ( user, device, purpose) => {

    // 1️⃣ Get Contacts
    const { contactMode } = getUserContacts(user);
    const smsTemplate = VerificationTemplateMapping[purpose].smsTemplate;
    const emailTemplate = VerificationTemplateMapping[purpose].emailTemplate;
    const route = VerificationTemplateMapping[purpose].route;

    // 2️⃣ Predict Type for Check
    const checkType = (contactMode === ContactModes.SMS) ? VerifyMode.OTP : VerifyMode.LINK;

    // 3️⃣ STEP 1: Check existing (Factory)
    // Hum chahte hain ki agar purana token valid hai, toh naya na bhejein (Rate limiting)
    const canResend = await CheckExistingTokenFactory(user._id, checkType, purpose);

    if (!canResend) {
        // Yahan hum Error throw karenge taaki Controller ko message mile
        throw new Error(`A valid ${checkType} already exists. Please wait before requesting again.`);
    }

    const security = verificationSecurity[purpose];

    // 4️⃣ STEP 2: Generate New Token
    const verificationResult = await generateVerificationForUser(
        user,
        device.deviceId,
        purpose,
        contactMode,
        security.MAX_ATTEMPTS,
        security.LINK_EXPIRY_MINUTES * 60  
    );

    if (!verificationResult) return false;

    // 5️⃣ STEP 3: Send (AWAIT for confirmation - user needs to know if sent)
    const isSent = await SendNotificationFactory(
        user,
        contactMode,
        verificationResult.token,
        verificationResult.type,
        emailTemplate,
        smsTemplate,
        route
    );

    if (!isSent) {
        return false;
    }

    logAuthEvent(user, device, "RESEND_VERIFICATION",
        `Resent ${verificationResult.type} for ${purpose} to User ID ${user._id} via ${contactMode}.`, null);
    return true;
};

module.exports = { resendVerificationService };