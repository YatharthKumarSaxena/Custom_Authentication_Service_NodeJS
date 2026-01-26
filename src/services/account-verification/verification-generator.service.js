const { VerifyMode, ContactModes } = require("@configs/enums.config");
const { verificationMode, verificationSecurity } = require("@configs/security.config");
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
    }).sort({ createdAt: -1 }).lean();
};

const findActiveLink = async ({ userId, deviceId, purpose }) => {
    return VerificationLinkModel.findOne({
        userId,
        deviceId,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).lean();
};

/**
 * 🔒 INTERNAL: only creates and stores verification link
 */
const generateUserLink = async ({ user, deviceId, purpose, contactMode, expiresAt }) => {

    const token = generateLinkToken();
    const tokenHash = hashLinkToken(token);

    const verificationResult = await VerificationLinkModel.create({
        userId: user._id,
        deviceId,
        contact: contactMode,
        purpose,
        tokenHash,
        expiresAt,
        isUsed: false
    });

    if (!verificationResult) {
        logWithTime(`❌ Link Verification creation failed for user: ${user._id || user}`);
        return null;
    }

    logWithTime(`🔗 Verification link generated for User ID ${user.userId} | Purpose: ${purpose}`);

    return {
        type: VerifyMode.LINK,
        token
    };
};

/**
 * 🔒 INTERNAL: only creates and stores OTP
 */
const generateUserOTP = async ({ user, deviceId, purpose, contactMode, maxAttempts, expiresAt }) => {

    const otp = generateOTP();
    const { otpHash, salt } = hashOTP(otp);

    const verificationResult = await OTPModel.create({
        userId: user._id,
        deviceId,
        contact: contactMode,
        purpose,
        otpHash,
        salt,
        expiresAt,
        maxAttempts,
        isUsed: false
    });

    if (!verificationResult) {
        logWithTime(`❌ OTP Verification creation failed for user: ${user._id || user}`);
        return null;
    }

    logWithTime(`🔢 Generated OTP for User ID ${user.userId} for purpose ${purpose}.`);

    return {
        type: VerifyMode.OTP,
        token: otp
    };
};

/**
 * 🚀 MASTER DECISION ENGINE
 */
const generateVerificationForUser = async (
    user,
    deviceId,
    purpose,
    contactMode
) => {
    try {
        const securityConfig = verificationSecurity[purpose];
        if (!securityConfig) {
            logWithTime(`❌ No security config found for purpose: ${purpose}`);
            return null;
        }

        const { MAX_ATTEMPTS, OTP_EXPIRY_MINUTES, LINK_EXPIRY_MINUTES } = securityConfig;

        const shouldGenerateLink =
            verificationMode === VerifyMode.LINK &&
            contactMode === ContactModes.EMAIL;

        let verificationResult;
        let expirationDate = new Date();

        if (shouldGenerateLink) {

            const existingLink = await findActiveLink({
                userId: user._id,
                deviceId,
                purpose
            });

            if (existingLink) {
                return {
                    type: VerifyMode.LINK,
                    reused: true,
                    token: null,
                    expiresAt: existingLink.expiresAt
                };
            }

            expirationDate = new Date(Date.now() + LINK_EXPIRY_MINUTES * 60 * 1000);

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
                return {
                    type: VerifyMode.OTP,
                    reused: true,
                    token: null,
                    expiresAt: existingOTP.expiresAt
                };
            }

            expirationDate = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            verificationResult = await generateUserOTP({
                user,
                deviceId,
                purpose,
                contactMode,
                maxAttempts: MAX_ATTEMPTS,
                expiresAt: expirationDate
            });
        }

        if (!verificationResult) {
            logWithTime(`❌ Verification generation failed for user: ${user._id || user}`);
            return null;
        }

        // ✅ CONSISTENT FINAL RESPONSE
        return {
            ...verificationResult,
            reused: false,
            expiresAt: expirationDate
        };

    } catch (err) {
        logWithTime(`❌ Error generating verification for user: ${user._id || user}`);
        errorMessage(err);
        return null;
    }
};

module.exports = {
    generateVerificationForUser,
    generateUserLink,
    generateUserOTP
};
