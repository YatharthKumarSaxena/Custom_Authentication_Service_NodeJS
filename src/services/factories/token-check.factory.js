const { OTPModel } = require("@models/otp.model");
const { VerificationLinkModel } = require("@models/link.model");
const { VerifyMode } = require("@configs/enums.config");

const CheckExistingTokenFactory = async (userId, type, contact, purpose) => {
    
    // 1. Strategy Map
    const strategy = {
        [VerifyMode.OTP]: { model: OTPModel },
        [VerifyMode.LINK]: { model: VerificationLinkModel }
    };

    const selectedStrategy = strategy[type];

    // Safety: Agar type galat hai (undefined/null), to false return karo ya crash hone se bachao
    if (!selectedStrategy) {
        console.error(`Invalid VerifyMode provided: ${type}`);
        return false; // Ya true, depend karta hai aap default kya chahte ho. False safe hai.
    }

    // 2. Common Query
    const existingRecord = await selectedStrategy.model.findOne({
        userId: userId,
        purpose: purpose,
        contact: contact,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    });

    // 3. Logic: Agar record mila, to 'False' (Mat bhejo). Nahi mila to 'True' (Bhej do).
    if (existingRecord) {
        return false; 
    }

    return true;
};

module.exports = { CheckExistingTokenFactory };