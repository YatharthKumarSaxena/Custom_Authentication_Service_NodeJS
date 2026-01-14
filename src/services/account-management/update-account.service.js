const { UserModel } = require("@models/user.model"); // UserModel import karna zaroori hai
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { 
    validateLength, 
    isValidRegex 
} = require("@utils/validators-factory.util");
const { 
    emailRegex, 
    countryCodeRegex, 
    localNumberRegex, 
    firstNameRegex 
} = require("@configs/regex.config");
const { 
    emailLength, 
    countryCodeLength, 
    localNumberLength, 
    firstNameLength 
} = require("@configs/fields-length.config");

/**
 * Service to update user profile
 * Handles validation, duplication checks, and verification resets.
 */
const updateAccountService = async (user, device, updatePayload) => {
    const { firstName, email, countryCode, localNumber } = updatePayload;
    const updatedFields = [];

    // ------------------ 1. First Name Update ------------------
    if (firstName && firstName !== user.firstName) {
        const cleanName = firstName;
        
        if (!validateLength(cleanName, firstNameLength.min, firstNameLength.max)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: `First Name must be between ${firstNameLength.min}-${firstNameLength.max} chars.` };
        }
        if (!isValidRegex(cleanName, firstNameRegex)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: "Invalid First Name format." };
        }

        user.firstName = cleanName;
        updatedFields.push("First Name");

    }

    // ------------------ 2. Email Update ------------------
    if (email && email !== user.email) {
        const cleanEmail = email;

        // A. Validation
        if (!validateLength(cleanEmail, emailLength.min, emailLength.max)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: "Invalid Email length." };
        }
        if (!isValidRegex(cleanEmail, emailRegex)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: "Invalid Email format." };
        }

        // B. Duplicate Check
        const emailExists = await UserModel.exists({ email: cleanEmail });
        if (emailExists) {
            throw { type: AuthErrorTypes.RESOURCE_EXISTS, message: "This Email ID is already registered." };
        }

        // C. Update & Reset Verification
        user.email = cleanEmail;
        user.isEmailVerified = false; // ⚠️ Security: Naya email verified nahi hai
        updatedFields.push("Email");
    }

    // ------------------ 3. Phone Update ------------------
    // Logic: Agar CountryCode ya LocalNumber me se kuch bhi naya hai
    const isNewCountryCode = countryCode && countryCode !== user.countryCode;
    const isNewLocalNumber = localNumber && localNumber !== user.localNumber;

    if (isNewCountryCode || isNewLocalNumber) {
        // Purana data use karo agar naya nahi bheja
        const newCC = isNewCountryCode ? countryCode : user.countryCode;
        const newLN = isNewLocalNumber ? localNumber : user.localNumber;

        // A. Validation
        if (!validateLength(newCC, countryCodeLength.min, countryCodeLength.max) || !isValidRegex(newCC, countryCodeRegex)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: "Invalid Country Code." };
        }
        if (!validateLength(newLN, localNumberLength.min, localNumberLength.max) || !isValidRegex(newLN, localNumberRegex)) {
            throw { type: AuthErrorTypes.INVALID_INPUT, message: "Invalid Phone Number." };
        }

        // B. Unified Phone Creation
        const newUnifiedPhone = newCC + newLN;

        // C. Duplicate Check
        const phoneExists = await UserModel.exists({ phone: newUnifiedPhone });
        if (phoneExists) {
            throw { type: AuthErrorTypes.RESOURCE_EXISTS, message: "This Phone Number is already registered." };
        }

        // D. Update & Reset Verification
        user.countryCode = newCC;
        user.localNumber = newLN;
        user.phone = newUnifiedPhone;
        user.isPhoneVerified = false; // ⚠️ Security: Naya phone verified nahi hai
        updatedFields.push("Phone Number");
    }

    // ------------------ 4. No Changes Check ------------------
    if (updatedFields.length === 0) {
        return { success: false, message: "No changes detected." };
    }

    // ------------------ 5. Save & Log ------------------
    await user.save();

    logWithTime(`✅ Profile updated for UserID: ${user.userId}. Fields: [${updatedFields.join(", ")}]`);
    
    logAuthEvent(
        user, 
        device, 
        AUTH_LOG_EVENTS.UPDATE_ACCOUNT_DETAILS, 
        `User updated profile fields: ${updatedFields.join(", ")}`,
        null
    );

    return {
        success: true,
        message: "Profile updated successfully.",
        updatedFields
    };
};

module.exports = { updateAccountService };