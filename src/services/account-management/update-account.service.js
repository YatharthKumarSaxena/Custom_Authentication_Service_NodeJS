const { UserModel } = require("@models/user.model"); // UserModel import karna zaroori hai
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
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
    
    // Store old values for notification purposes
    const oldEmail = user.email;
    const oldPhone = user.phone;

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

    // ------------------ 6. Send Notifications ------------------
    
    // A. If Email Changed - Alert to OLD email + Welcome to NEW email
    if (updatedFields.includes("Email")) {
        // Alert to OLD email (using direct sendEmail)
        const { sendEmail } = require("@services/mail.service");
        const { generateEmailHtml } = require("@utils/email-generator.util");
        
        const oldEmailAlert = generateEmailHtml(userTemplate.emailChangeAlert, {
            name: user.firstName || "User",
            new_email: user.email
        });
        
        if (oldEmailAlert && oldEmail) {
            sendEmail(oldEmail, oldEmailAlert.subject, oldEmailAlert.html);
            logWithTime(`📧 Email change alert sent to old email: ${oldEmail}`);
        }
        
        // Welcome to NEW email (verification will be sent separately)
        const newEmailWelcome = generateEmailHtml(userTemplate.verifyNewEmail, {
            name: user.firstName || "User"
        });
        
        if (newEmailWelcome && user.email) {
            sendEmail(user.email, newEmailWelcome.subject, newEmailWelcome.html);
            logWithTime(`📧 Welcome email sent to new email: ${user.email}`);
        }
    }
    
    // B. If Phone Changed - Alert to OLD phone + Welcome to NEW phone (if SMS available)
    if (updatedFields.includes("Phone Number")) {
        const { sendSMS } = require("@services/sms.service");
        const { generateSmsMessage } = require("@utils/sms-generator.util");
        
        // Alert to OLD phone
        if (oldPhone && userSmsTemplate.phoneChangeAlert) {
            const oldPhoneAlert = generateSmsMessage(userSmsTemplate.phoneChangeAlert, null);
            if (oldPhoneAlert) {
                sendSMS(oldPhone, oldPhoneAlert);
                logWithTime(`📱 Phone change alert sent to old phone: ${oldPhone}`);
            }
        }
        
        // Welcome to NEW phone
        if (user.phone && userSmsTemplate.verifyNewPhone) {
            const newPhoneWelcome = generateSmsMessage(userSmsTemplate.verifyNewPhone, null);
            if (newPhoneWelcome) {
                sendSMS(user.phone, newPhoneWelcome);
                logWithTime(`📱 Welcome SMS sent to new phone: ${user.phone}`);
            }
        }
    }
    
    // C. For other updates (firstName only) - send to current contact
    if (updatedFields.length > 0 && !updatedFields.includes("Email") && !updatedFields.includes("Phone Number")) {
        const contactInfo = getUserContacts(user);
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.profileUpdated,
            smsTemplate: userSmsTemplate.profileUpdated,
            data: { name: user.firstName || "User" }
        });
    }

    return {
        success: true,
        message: "Profile updated successfully.",
        updatedFields
    };
};

module.exports = { updateAccountService };