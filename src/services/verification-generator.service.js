const { VerifyMode, ContactModes } = require("@configs/enums.config");
const { verificationMode } = require("@configs/security.config");
const { generateLinkToken, hashLinkToken } = require("../utils/link.util");
const { generateOTP, hashOTP } = require("../utils/otp.util");
const { logWithTime } = require("../utils/time-stamps.util");
const { VerificationLinkModel } = require("@models/link.model");
const { OTPModel } = require("@models/otp.model");
const { errorMessage } = require("../utils/error-handler.util");

/**
 * 🔒 INTERNAL: Sirf Link Generate aur Save karega
 */
const generateUserLink = async ({ user, deviceId, purpose, contactMode, expiresAt }) => {
    const link = generateLinkToken();
    const { tokenHash, salt } = hashLinkToken(link);

    await VerificationLinkModel.create({
        userId: user._id,
        deviceId: deviceId,
        contact: contactMode,
        purpose: purpose,
        tokenHash: tokenHash,
        salt: salt,
        expiresAt: expiresAt,
        isUsed: false
    });

    return { type: 'LINK', token: link };
};

/**
 * 🔒 INTERNAL: Sirf OTP Generate aur Save karega
 */
const generateUserOTP = async ({ user, deviceId, purpose, contactMode, maxAttempts, expiresAt }) => {
    const otp = generateOTP();
    const { otpHash, salt } = hashOTP(otp);

    await OTPModel.create({
        userId: user._id,
        deviceId: deviceId,
        contact: contactMode,
        purpose: purpose,
        otpHash: otpHash,
        salt: salt,
        expiresAt: expiresAt,
        maxAttempts: maxAttempts,
        isUsed: false
    });

    return { type: 'OTP', token: otp };
};

/**
 * 🚀 PUBLIC MASTER FUNCTION
 * Ye Logic Decision Tree handle karega aur sahi internal function call karega
 */
const generateVerificationForUser = async (user, deviceId, purpose, contactMode, maxAttempts, expiryTime) => {
    try {
        // 1. Expiry Calculation Common hai
        const expirationDate = new Date(Date.now() + expiryTime * 1000);

        // 2. Logic Check (Kaunsa tareeka use karna hai?)
        const shouldGenerateLink = (
            verificationMode === VerifyMode.LINK &&
            contactMode === ContactModes.EMAIL // Only Email supports Links
        );

        if (shouldGenerateLink) {
            // ✅ Call Internal Link Function
            return await generateUserLink({
                user,
                deviceId,
                purpose,
                contactMode,
                expiresAt: expirationDate
            });
        } else {
            // ✅ Call Internal OTP Function (Default/Fallback)
            return await generateUserOTP({
                user,
                deviceId,
                purpose,
                contactMode,
                maxAttempts,
                expiresAt: expirationDate
            });
        }

    } catch (err) {
        logWithTime(`❌ Error generating verification for user: ${user._id || user}`);
        errorMessage(err);
        return null; // Controller ko pata chal jayega ki fail hua
    }
};

module.exports = {
    generateVerificationForUser,
    generateUserLink, // Exported in case you need to force-generate a link internally later
    generateUserOTP   // Exported in case you need to force-generate an OTP internally later
};