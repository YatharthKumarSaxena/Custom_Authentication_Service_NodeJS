const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { AuthErrorTypes, VerificationPurpose, VerifyMode, ContactModes } = require("@configs/enums.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
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

const updateAccountService = async (user, device, requestId, updatePayload) => {

    const { firstName, email, countryCode, localNumber } = updatePayload;

    const updateSet = {};
    const updatedFields = [];

    /* ---------------- First Name ---------------- */
    if (firstName && firstName !== user.firstName) {

        if (!validateLength(firstName, firstNameLength.min, firstNameLength.max)) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: `First Name must be between ${firstNameLength.min}-${firstNameLength.max} characters.`
            };
        }

        if (!isValidRegex(firstName, firstNameRegex)) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: "Invalid First Name format."
            };
        }

        updateSet.firstName = firstName;
        updatedFields.push("First Name");
    }

    /* ---------------- Email ---------------- */
    if (email && email !== user.email) {

        if (!validateLength(email, emailLength.min, emailLength.max)) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: "Invalid Email length."
            };
        }

        if (!isValidRegex(email, emailRegex)) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: "Invalid Email format."
            };
        }

        const emailExists = await UserModel.exists({ email });
        if (emailExists) {
            return {
                success: false,
                type: AuthErrorTypes.RESOURCE_EXISTS,
                message: "This Email ID is already registered."
            };
        }

        updateSet.email = email;
        updateSet.isEmailVerified = false;
        updatedFields.push("Email");

        // Send notification to OLD email about the change
        const oldEmailContact = {
            email: user.email,
            phone: user.countryCode && user.localNumber ? user.countryCode + user.localNumber : null,
            countryCode: user.countryCode,
            localNumber: user.localNumber,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            contactMode: ContactModes.EMAIL // Force email notification
        };

        logWithTime(`🚨 Sending email change alert to OLD email: ${user.email} (new email: ${email})`);

        sendNotification({
            contactInfo: oldEmailContact,
            emailTemplate: userTemplate.emailChangeAlert,
            smsTemplate: null,
            data: { 
                name: user.firstName || "User",
                new_email: email 
            }
        });

    }

    /* ---------------- Phone ---------------- */
    const isNewCC = countryCode && countryCode !== user.countryCode;
    const isNewLN = localNumber && localNumber !== user.localNumber;

    if (isNewCC || isNewLN) {

        const newCC = isNewCC ? countryCode : user.countryCode;
        const newLN = isNewLN ? localNumber : user.localNumber;

        if (
            !validateLength(newCC, countryCodeLength.min, countryCodeLength.max) ||
            !isValidRegex(newCC, countryCodeRegex)
        ) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: "Invalid Country Code."
            };
        }

        if (
            !validateLength(newLN, localNumberLength.min, localNumberLength.max) ||
            !isValidRegex(newLN, localNumberRegex)
        ) {
            return {
                success: false,
                type: AuthErrorTypes.INVALID_INPUT,
                message: "Invalid Phone Number."
            };
        }

        const unifiedPhone = newCC + newLN;

        const phoneExists = await UserModel.exists({ phone: unifiedPhone });
        if (phoneExists) {
            return {
                success: false,
                type: AuthErrorTypes.RESOURCE_EXISTS,
                message: "This Phone Number is already registered."
            };
        }

        updateSet.countryCode = newCC;
        updateSet.localNumber = newLN;
        updateSet.phone = unifiedPhone;
        updateSet.isPhoneVerified = false;

        updatedFields.push("Phone Number");

        // Send notification to OLD phone number about the change
        const oldPhoneContact = {
            email: user.email,
            phone: user.countryCode && user.localNumber ? user.countryCode + user.localNumber : null,
            countryCode: user.countryCode,
            localNumber: user.localNumber,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            contactMode: ContactModes.PHONE // Force SMS notification
        };

        logWithTime(`🚨 Sending phone change alert to OLD phone: ${user.countryCode}${user.localNumber} (new phone: ${unifiedPhone})`);

        sendNotification({
            contactInfo: oldPhoneContact,
            emailTemplate: null,
            smsTemplate: userSmsTemplate.phoneChangeAlert,
            data: { name: user.firstName || "User" }
        });
    }

    /* ---------------- No Change ---------------- */
    if (updatedFields.length === 0) {
        return {
            success: false,
            message: "No changes detected."
        };
    }

    /* ---------------- Atomic DB Update ---------------- */
    const updatedUser = await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $set: updateSet },
        { new: true }
    );

    if (!updatedUser) {
        return {
            success: false,
            message: "Failed to update profile."
        };
    }

    /* ---------------- Logs ---------------- */
    logWithTime(
        `✅ Profile updated for UserID: ${updatedUser.userId}. Fields: [${updatedFields.join(", ")}]`
    );

    logAuthEvent(
        updatedUser,
        device,
        requestId,
        AUTH_LOG_EVENTS.UPDATE_ACCOUNT_DETAILS,
        `User updated profile fields: ${updatedFields.join(", ")}`,
        null
    );

    /* ---------------- Send Verification to New Email/Phone ---------------- */
    let emailVerificationSent = false;
    let phoneVerificationSent = false;

    // Get or create device document for verification
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: device.deviceUUID },
        {
            $set: {
                deviceName: device.deviceName,
                deviceType: device.deviceType
            }
        },
        { new: true, upsert: true }
    );

    // Send verification to NEW email
    if (updatedFields.includes("Email")) {
        const newContactInfo = getUserContacts(updatedUser);
        
        const emailVerification = await generateVerificationForUser(
            updatedUser,
            deviceDoc._id,
            VerificationPurpose.EMAIL_VERIFICATION,
            newContactInfo.contactMode
        );

        if (emailVerification && !emailVerification.reused) {
            const { type, token } = emailVerification;
            
            sendNotification({
                contactInfo: newContactInfo,
                emailTemplate: userTemplate.verifyNewEmail,
                smsTemplate: null,
                data: {
                    name: updatedUser.firstName || "User",
                    otp: type === VerifyMode.OTP ? token : undefined,
                    link: type === VerifyMode.LINK ? token : undefined
                }
            });
            
            emailVerificationSent = true;
            logWithTime(`📧 Email verification sent to new email: ${updatedUser.email}`);
        }
    }

    // Send verification to NEW phone
    if (updatedFields.includes("Phone Number")) {
        const newContactInfo = getUserContacts(updatedUser);
        
        const phoneVerification = await generateVerificationForUser(
            updatedUser,
            deviceDoc._id,
            VerificationPurpose.PHONE_VERIFICATION,
            newContactInfo.contactMode
        );

        if (phoneVerification && !phoneVerification.reused) {
            const { type, token } = phoneVerification;
            
            sendNotification({
                contactInfo: newContactInfo,
                emailTemplate: null,
                smsTemplate: userSmsTemplate.verifyNewPhone,
                data: {
                    name: updatedUser.firstName || "User",
                    otp: token
                }
            });
            
            phoneVerificationSent = true;
            logWithTime(`📱 Phone verification sent to new number: ${updatedUser.phone}`);
        }
    }

    /* ---------------- General Profile Update Notification ---------------- */
    // Only send if firstName was updated (not email/phone)
    if (updatedFields.includes("First Name") && updatedFields.length === 1) {
        const contactInfo = getUserContacts(updatedUser);
        
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.profileUpdated,
            smsTemplate: userSmsTemplate.profileUpdated,
            data: { name: updatedUser.firstName || "User" }
        });
    }

    return {
        success: true,
        message: "Profile updated successfully.",
        updatedFields,
        emailVerificationSent,
        phoneVerificationSent
    };
};

module.exports = { updateAccountService };