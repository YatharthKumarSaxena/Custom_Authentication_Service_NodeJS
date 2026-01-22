const { VerifyMode, ContactModes } = require("@configs/enums.config");
const { verificationMode } = require("@configs/security.config");
const { generateLinkToken, hashLinkToken } = require("../../utils/link.util");
const { generateOTP, hashOTP } = require("../../utils/otp.util");
const { logWithTime } = require("../../utils/time-stamps.util");
const { VerificationLinkModel } = require("@models/link.model");
const { OTPModel } = require("@models/otp.model");
const { errorMessage } = require("../../utils/error-handler.util");

const findActiveOTP = async ({ userId, deviceId, purpose }) => {
    return OTPModel.findOne({
        userId,
        deviceId,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ["$attemptCount", "$maxAttempts"] }
    }).sort({ createdAt: -1 });
};

const findActiveLink = async ({ userId, deviceId, purpose }) => {
    return VerificationLinkModel.findOne({
        userId,
        deviceId,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
};

/**
 * 🔒 INTERNAL: Sirf Link Generate aur Save karega
 */
const generateUserLink = async ({ user, deviceId, purpose, contactMode, expiresAt }) => {
    const link = generateLinkToken();
    const { tokenHash, salt } = hashLinkToken(link);

    const verificationResult = await VerificationLinkModel.create({
        userId: user._id,
        deviceId: deviceId,
        contact: contactMode,
        purpose: purpose,
        tokenHash: tokenHash,
        salt: salt,
        expiresAt: expiresAt,
        isUsed: false
    });

    if (!verificationResult) {
        logWithTime(`❌ Link Verification creation failed for user: ${user._id || user}`);
        return null;
    }

    logWithTime(`🔗 Generated Link for User ID ${user.userId} for purpose ${purpose}.`);
    return { type: 'LINK', token: link };
};

/**
 * 🔒 INTERNAL: Sirf OTP Generate aur Save karega
 */
const generateUserOTP = async ({ user, deviceId, purpose, contactMode, maxAttempts, expiresAt }) => {
    const otp = generateOTP();
    console.log("Generated OTP:", otp); // For debugging; remove in production
    const { otpHash, salt } = hashOTP(otp);

    const verificationResult = await OTPModel.create({
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

    if (!verificationResult) {
        logWithTime(`❌ OTP Verification creation failed for user: ${user._id || user}`);
        return null;
    }

    logWithTime(`🔢 Generated OTP for User ID ${user.userId} for purpose ${purpose}.`);

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

        let verificationResult;

        if (shouldGenerateLink) {

            const existingLink = await findActiveLink({
                userId: user._id,
                deviceId,
                purpose
            });

            if (existingLink) {
                logWithTime(`⚠️ Active verification link already exists for ${user.userId}`);

                return {
                    type: VerifyMode.LINK,
                    reused: true,
                    expiresAt: existingLink.expiresAt
                };
            }
            verificationResult = await generateUserLink({
                user,
                deviceId,
                purpose,
                contactMode,
                expiresAt: expirationDate
            });
        } else {

            const existingOTP = await findActiveOTP({
                userId: user._id,
                deviceId,
                purpose
            });

            if (existingOTP) {
                logWithTime(`⚠️ Active OTP already exists for ${user.userId}`);

                return {
                    type: VerifyMode.OTP,
                    reused: true,
                    expiresAt: existingOTP.expiresAt
                };
            }
            verificationResult = await generateUserOTP({
                user,
                deviceId,
                purpose,
                contactMode,
                maxAttempts,
                expiresAt: expirationDate
            });
        }

        if (!verificationResult) {
            logWithTime(`❌ Verification generation failed for user: ${user._id || user}`);
            return null;
        }

        return verificationResult; // Return { type, token }

    } catch (err) {
        logWithTime(`❌ Error generating verification for user: ${user._id || user}`);
        errorMessage(err);
        return null;
    }
};

module.exports = {
    generateVerificationForUser,
    generateUserLink, // Exported in case you need to force-generate a link internally later
    generateUserOTP   // Exported in case you need to force-generate an OTP internally later
};