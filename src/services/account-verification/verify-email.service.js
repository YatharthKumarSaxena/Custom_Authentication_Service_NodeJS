// verify-email.service.js
const { AUTO_LOGIN_AFTER_VERIFICATION } = process.env; // .env se uthaya
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { loginUserOnDevice } = require("@services/auth/auth-session.service");
const { logAuthEvent } = require("@utils/auth-log-util");

const verifyEmailService = async (user, device, code, contactMode) => {
    
    // 1️⃣ Validate Token/OTP
    const validation = await verifyVerification(
        user._id, 
        VerificationPurpose.EMAIL_VERIFICATION, 
        code, 
        contactMode
    );

    if (!validation.success) throw new Error(validation.message);

    // 2️⃣ Update User Status
    user.isEmailVerified = true;
    user.status = "ACTIVE"; 
    await user.save();

    // 3️⃣ Flexibility: Check from .env
    const isAutoLoginEnabled = AUTO_LOGIN_AFTER_VERIFICATION === 'true';

    let authData = null;
    if (isAutoLoginEnabled) {
        // Generate tokens (JWT/Session)
        // authData = await generateUserSession(user); 
        authData = { token: "..." }; 
    }

    logAuthEvent(user, device, AUTH_LOG_EVENTS.VERIFY_EMAIL,
        `User ID ${user._id} verified email via ${contactMode}.`, null);

    return {
        success: true,
        autoLoggedIn: isAutoLoginEnabled,
        authData
    };
};

module.exports = { verifyEmailService };