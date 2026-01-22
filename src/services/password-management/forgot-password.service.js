const { CheckExistingTokenFactory } = require("@services/factories/token-check.factory");
const { SendNotificationFactory } = require("@services/factories/notification.factory"); 
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");

const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { FRONTEND_ROUTES } = require("@configs/frontend-routes.config");
const { VerifyMode, VerificationPurpose, ContactModes } = require("@configs/enums.config");
const { forgotPasswordSecurity } = require("@configs/security.config");

const forgotPasswordService = async(user, deviceId) => {
    
    // 1️⃣ Get Contact Details
    const { email, phone, contactMode } = getUserContacts(user);

    // 2️⃣ Predict Type for Checking (Before Generation)
    // Agar SMS hai to OTP, warna LINK (Email ya Both ke liye usually Link prefer karte hain)
    // Note: Ye logic aapke system ke hisaab se adjust kar sakte hain
    let expectedType = (contactMode === ContactModes.SMS) ? VerifyMode.OTP : VerifyMode.LINK;

    // 3️⃣ STEP 1: Check if sending is allowed (Spam Prevention)
    const canSend = await CheckExistingTokenFactory(
        user._id, 
        expectedType, 
        VerificationPurpose.FORGOT_PASSWORD
    );

    if (!canSend) {
        // Error message user-friendly banayein
        const msg = expectedType === VerifyMode.OTP 
            ? "A valid OTP is already sent. Please check your SMS." 
            : "A reset link is already sent. Please check your Email.";
        throw new Error(msg);
    }

    // 4️⃣ STEP 2: Generate Token (Database Operation)
    const verificationResult = await generateVerificationForUser(
        user,
        deviceId,
        VerificationPurpose.FORGOT_PASSWORD,
        contactMode,
        forgotPasswordSecurity.MAX_ATTEMPTS,
        forgotPasswordSecurity.LINK_EXPIRY_MINUTES * 60
    );

    if (!verificationResult) {
        throw new Error("Unable to generate verification token. Please try again later.");
    }

    const { type, token } = verificationResult; // Actual Generated Type & Token

    // 5️⃣ STEP 3: Send Notification (AWAIT for confirmation)
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
        throw new Error("Failed to send verification code. Please try again.");
    }

    // Return info for the controller response
    return {
        email,
        phone,
        contactMode,
        type
    };
};

module.exports = { forgotPasswordService };