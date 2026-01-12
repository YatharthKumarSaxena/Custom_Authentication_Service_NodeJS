const { OTPModel } = require("@models/otp.model");
const { VerificationLinkModel } = require("@models/link.model");
const { verifyOTP } = require("@utils/otp.util");
const { verifyLinkToken } = require("@utils/link.util");
const { VerifyMode, ContactModes } = require("@configs/enums.config"); // ContactModes import kiya
const { verificationMode } = require("@configs/security.config");

/**
 * Service to Verify OTP with Rate Limiting / Retry Mechanism
 */
const verifyUserOTP = async ({ userId, purpose, inputOtp }) => {
    // 1. Find the most recent, unused OTP
    // 🔥 FIX: Added .select("+otpHash +salt") kyunki model me wo select: false hain
    const otpRecord = await OTPModel.findOne({
        userId,
        purpose,
        isUsed: false
    })
    .select("+otpHash +salt") 
    .sort({ createdAt: -1 });

    // 2. Check if OTP exists
    if (!otpRecord) {
        // 🔥 FIX: Added 'return' keyword. Bina iske code crash ho jata niche.
        return { success: false, message: "No valid OTP found. Please request a new one." };
    }

    // 3. Check Expiry
    if (new Date() > otpRecord.expiresAt) {
        return { success: false, message: "OTP has expired. Please request a new one." };
    }

    // 4. 🔥 Check Max Attempts (The Retry Logic)
    if (otpRecord.attemptCount >= otpRecord.maxAttempts) {
        return { success: false, message: "Max verification attempts reached. This OTP is now invalid." };
    }

    // 5. Verify Hash
    const isValid = verifyOTP(inputOtp, otpRecord.otpHash, otpRecord.salt);

    if (!isValid) {
        // ❌ INCORRECT OTP SCENARIO
        
        // Attempt count badhao
        otpRecord.attemptCount += 1;
        await otpRecord.save();

        const remaining = otpRecord.maxAttempts - otpRecord.attemptCount;
        
        if (remaining <= 0) {
            return { success: false, message: "Invalid OTP. Max attempts reached. Request a new code." };
        }
        
        return { success: false, message: `Invalid OTP. You have ${remaining} attempts remaining.` };
    }

    // ✅ SUCCESS SCENARIO
    
    // Mark as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    return { success: true, message: "OTP Verified Successfully" };
};

/**
 * Service to Verify Link
 */
const verifyUserLink = async ({ userId, purpose, inputToken }) => {
    // 1. Find the link record
    // 🔥 FIX: Added .select("+tokenHash +salt") here too
    const linkRecord = await VerificationLinkModel.findOne({
        userId,
        purpose,
        isUsed: false
    })
    .select("+tokenHash +salt")
    .sort({ createdAt: -1 });

    if (!linkRecord) {
        return { success: false, message: "Invalid or already used verification link." };
    }

    if (new Date() > linkRecord.expiresAt) {
        return { success: false, message: "Link has expired. Please request a new one." };
    }

    // Verify the Token
    const isValid = verifyLinkToken(inputToken, linkRecord.tokenHash, linkRecord.salt);

    if (!isValid) {
        return { success: false, message: "Invalid verification link." };
    }

    // Mark used
    linkRecord.isUsed = true;
    await linkRecord.save();

    return { success: true, message: "Link Verified Successfully" };
};

const verifyVerification = async (userId, purpose, code, type, contactMode) => {
    
    const checkVerifyType = (
        verificationMode === VerifyMode.LINK && 
        contactMode === ContactModes.EMAIL // 👈 Important Check: Phone nahi hona chahiye
    );
    
    if (checkVerifyType) {
        return await verifyUserLink({ 
            userId, 
            purpose, 
            inputToken: code 
        });
    } else {
        // Default to OTP (Safe fallback)
        return await verifyUserOTP({ 
            userId, 
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