const { VerificationLinkModel, OTPModel, UserModel } = require("@models/index");
const { verifyOTP } = require("@utils/otp.util");
const { hashLinkToken } = require("@utils/link.util");
const { VerifyMode, ContactModes } = require("@configs/enums.config"); // ContactModes import kiya
const { verificationMode } = require("@configs/security.config");

/**
 * Service to Verify OTP with Rate Limiting / Retry Mechanism
 */
const verifyUserOTP = async ({ userId, deviceId, purpose, inputOtp }) => {
    // 1. Find the most recent, unused OTP
    const otpRecord = await OTPModel
        .findOne({
            userId,
            deviceId,
            purpose,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        })
        .sort({ createdAt: -1 })
        .select("+otpHash +salt")
        .lean();

    // 2. Check if OTP exists
    if (!otpRecord) {
        return { success: false, message: "No valid OTP found. Please request a new one." };
    }

    // 3. Check Max Attempts (The Retry Logic)
    if (otpRecord.attemptCount >= otpRecord.maxAttempts) {
        return { success: false, message: "Max verification attempts reached. This OTP is now invalid." };
    }

    // 4. Verify Hash
    const isValid = verifyOTP(inputOtp, otpRecord.otpHash, otpRecord.salt);

    if (!isValid) {
        // INCORRECT OTP SCENARIO

        await OTPModel.updateOne(
            { _id: otpRecord._id },
            { $inc: { attemptCount: 1 } }
        );

        const remaining = otpRecord.maxAttempts - (otpRecord.attemptCount + 1);

        if (remaining <= 0) {
            return { success: false, message: "Invalid OTP. Max attempts reached. Request a new code." };
        }

        return { success: false, message: `Invalid OTP. You have ${remaining} attempts remaining.` };
    }

    // SUCCESS SCENARIO

    await OTPModel.updateOne(
        { _id: otpRecord._id, isUsed: false },
        { $set: { isUsed: true } }
    );

    return { success: true, message: "OTP Verified Successfully" };
};

/**
 * Service to verify verification link (industry standard)
 */
const verifyUserLink = async ({ inputToken, purpose }) => {

    // Hash incoming token using same secret
    const tokenHash = hashLinkToken(inputToken);

    // Atomically find & mark link as used
    const linkRecord = await VerificationLinkModel.findOneAndUpdate(
        {
            tokenHash,
            purpose,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        },
        {
            $set: { isUsed: true }
        },
        {
            new: true
        }
    );

    // If no record found → invalid / expired / already used
    if (!linkRecord) {
        return {
            success: false,
            message: "Invalid or expired verification link."
        };
    }

    // Fetch user from verified link
    const user = await UserModel.findById(linkRecord.userId);

    if (!user) {
        return {
            success: false,
            message: "User not found."
        };
    }

    // Account status checks
    if (!user.isActive) {
        return {
            success: false,
            message: "User account is deactivated."
        };
    }

    if (user.isBlocked) {
        return {
            success: false,
            message: "User account is blocked."
        };
    }

    // Verified successfully
    return {
        success: true,
        user,
        purpose: linkRecord.purpose,
        message: "Link Verified Successfully."
    };
};

const verifyVerification = async (userId, deviceId, purpose, code, contactMode) => {

    const checkVerifyType = (
        verificationMode === VerifyMode.LINK &&
        contactMode === ContactModes.EMAIL // Important Check: Phone nahi hona chahiye
    );

    if (checkVerifyType) {
        return await verifyUserLink({
            inputToken: code,
            purpose
        });
    } else {
        // Default to OTP (Safe fallback)
        return await verifyUserOTP({
            userId,
            deviceId,
            purpose,
            inputOtp: code
        });
    }
};

module.exports = {
    verifyUserOTP,
    verifyUserLink,
    verifyVerification
};