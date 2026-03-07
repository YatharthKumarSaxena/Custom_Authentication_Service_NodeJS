const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { makeUserIdWithPrefix } = require("@/services/common/userId.service");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

const {
    AuthErrorTypes,
    VerificationPurpose,
    VerifyMode,
    AuthModes
} = require("@configs/enums.config");

const {
    AUTO_EMAIL_VERIFICATION,
    AUTO_PHONE_VERIFICATION,
    authMode
} = require("@configs/security.config");

const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { hashPassword } = require("@/utils/auth.util");
const { userIdPrefix } = require("@/configs/id-prefixes.config");

/**
 * Sign Up Service
 * @param {Object} deviceInput - Device information
 * @param {Object} userPayload - User data (email, phone, password, etc)
 * @param {string} requestId - Request ID for logging
 * @param {string} idPrefix - Custom ID prefix (default: userIdPrefix for regular users)
 */
const signUpService = async (deviceInput, userPayload, requestId, idPrefix = userIdPrefix) => {
    try {
        const { email, countryCode, localNumber, phone, firstName, password } = userPayload;

        // 1. HASH PASSWORD
        const hashedPassword = await hashPassword(password);

        if (!hashedPassword) {
            return {
                success: false,
                type: AuthErrorTypes.SERVER_ERROR,
                message: "Password encryption failed."
            };
        }

        // 2. GENERATE USER ID
        const generatedUserID = await makeUserIdWithPrefix(idPrefix);

        if (generatedUserID === "0") {
            return {
                success: false,
                type: AuthErrorTypes.SERVER_LIMIT_REACHED,
                message: "User registration limit reached."
            };
        }

        if (!generatedUserID) {
            return {
                success: false,
                type: AuthErrorTypes.SERVER_ERROR,
                message: "User ID generation failed."
            };
        }

        // 3. PREPARE USER DATA
        const userData = {
            userId: generatedUserID,
            firstName,
            password: hashedPassword,
            isEmailVerified: false,
            isPhoneVerified: false,
            isActive: true
        };

        if (email?.trim()) userData.email = email.trim();

        if (countryCode && localNumber && phone) {
            userData.countryCode = countryCode.trim();
            userData.localNumber = localNumber.trim();
            userData.phone = phone.trim();
        }

        // 4. CREATE USER
        const newUser = await UserModel.create(userData);

        logWithTime(`🟢 User Created: ${newUser.userId}`);

    // 5. ENSURE DEVICE
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: deviceInput.deviceUUID },
        {
            deviceName: deviceInput.deviceName,
            deviceType: deviceInput.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6. CONTACT INFO
    const contactInfo = getUserContacts(newUser);

    let verificationSent = true;

    // 7. EMAIL VERIFICATION
    if (
        email &&
        AUTO_EMAIL_VERIFICATION &&
        (authMode === AuthModes.EMAIL ||
            authMode === AuthModes.BOTH ||
            authMode === AuthModes.EITHER)
    ) {
        const verificationResult = await generateVerificationForUser(
            newUser,
            deviceDoc._id,
            VerificationPurpose.EMAIL_VERIFICATION,
            contactInfo.contactMode
        );

        if (!verificationResult) {
            verificationSent = false;
        } else {
            const { type, token } = verificationResult;

            sendNotification({
                contactInfo,
                emailTemplate: userTemplate.verification,
                smsTemplate: userSmsTemplate.verification,
                data: {
                    name: newUser.firstName || "User",
                    otp: type === VerifyMode.OTP ? token : undefined,
                    link: type === VerifyMode.LINK ? token : undefined
                }
            });
        }
    }

    // 8. PHONE VERIFICATION
    if (
        phone &&
        AUTO_PHONE_VERIFICATION &&
        (authMode === AuthModes.PHONE ||
            authMode === AuthModes.BOTH ||
            authMode === AuthModes.EITHER)
    ) {
        const verificationResult = await generateVerificationForUser(
            newUser,
            deviceDoc._id,
            VerificationPurpose.PHONE_VERIFICATION,
            contactInfo.contactMode
        );

        if (!verificationResult) {
            verificationSent = false;
        } else {
            const { type, token } = verificationResult;

            sendNotification({
                contactInfo,
                emailTemplate: userTemplate.verification,
                smsTemplate: userSmsTemplate.verification,
                data: {
                    name: newUser.firstName || "User",
                    otp: type === VerifyMode.OTP ? token : undefined,
                    link: type === VerifyMode.LINK ? token : undefined
                }
            });
        }
    }

    // 9. AUTH LOG
    logAuthEvent(
        newUser,
        deviceInput,
        requestId,
        AUTH_LOG_EVENTS.REGISTER,
        "User registered successfully",
        null
    );

        // 10. FINAL RESPONSE
        return {
            success: true,
            userId: newUser.userId,
            contactMode: contactInfo.contactMode,
            verificationSent,
            message: verificationSent
                ? "Registration successful. Verification sent."
                : "Registration successful, but verification could not be sent. Please tap resend."
        };

    } catch (error) {
        // HANDLE DUPLICATE USER ERROR (MongoDB E11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            const message = field === 'email'
                ? "Email already registered."
                : field === 'phone'
                ? "Phone number already registered."
                : "User already exists.";

            logWithTime(`⚠️ Duplicate User: ${field} - ${error.keyValue?.[field]}`);

            return {
                success: false,
                type: AuthErrorTypes.RESOURCE_EXISTS,
                message
            };
        }

        // HANDLE OTHER ERRORS
        logWithTime(`❌ SignUp Service Error: ${error.message}`);
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "User registration failed."
        };
    }
};

module.exports = { signUpService };