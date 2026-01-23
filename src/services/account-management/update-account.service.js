const { UserModel } = require("@models/user.model");
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

const updateAccountService = async (user, device, updatePayload) => {

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
    }

    /* ---------------- No Change ---------------- */
    if (updatedFields.length === 0) {
        return {
            success: false,
            message: "No changes detected."
        };
    }

    /* ---------------- 🔥 Atomic DB Update ---------------- */
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
        AUTH_LOG_EVENTS.UPDATE_ACCOUNT_DETAILS,
        `User updated profile fields: ${updatedFields.join(", ")}`,
        null
    );

    /* ---------------- Notifications ---------------- */
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.profileUpdated,
        smsTemplate: userSmsTemplate.profileUpdated,
        data: { name: updatedUser.firstName || "User" }
    });

    return {
        success: true,
        message: "Profile updated successfully.",
        updatedFields
    };
};

module.exports = { updateAccountService };