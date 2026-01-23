const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { makeUserId } = require("@services/userId.service");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { AuthErrorTypes, VerificationPurpose, VerifyMode } = require("@configs/enums.config");
const { verificationSecurity } = require("@configs/security.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { hashPassword } = require("@/utils/auth.util");

const signUpService = async (deviceInput, userPayload) => {

    const { email, countryCode, localNumber, phone, firstName, password } = userPayload;

    // ---------------------------------------------------------
    // 1. HASH PASSWORD
    // ---------------------------------------------------------
    const hashedPassword = await hashPassword(password);

    if (!hashedPassword) {
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Password encryption failed."
        };
    }

    // ---------------------------------------------------------
    // 2. GENERATE USER ID
    // ---------------------------------------------------------
    const generatedUserID = await makeUserId();

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

    // ---------------------------------------------------------
    // 3. PREPARE USER DATA
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 4. CREATE USER
    // ---------------------------------------------------------
    const newUser = await UserModel.create(userData);

    logWithTime(`🟢 User Created: ${newUser.userId}`);

    // ---------------------------------------------------------
    // 5. ENSURE DEVICE
    // ---------------------------------------------------------
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: deviceInput.deviceUUID },
        {
            deviceName: deviceInput.deviceName,
            deviceType: deviceInput.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ---------------------------------------------------------
    // 6. GENERATE VERIFICATION
    // ---------------------------------------------------------
    const contactInfo = getUserContacts(newUser);

    const verificationResult = await generateVerificationForUser(
        newUser,
        deviceDoc._id,
        VerificationPurpose.REGISTRATION,
        contactInfo.contactMode,
        verificationSecurity[VerificationPurpose.REGISTRATION].MAX_ATTEMPTS,
        verificationSecurity[VerificationPurpose.REGISTRATION].LINK_EXPIRY_MINUTES * 60
    );

    if (!verificationResult) {
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Unable to generate verification code. Please try again."
        };
    }

    // ---------------------------------------------------------
    // 7. SEND NOTIFICATION
    // ---------------------------------------------------------
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

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.registrationSuccess,
        smsTemplate: userSmsTemplate.registrationSuccess,
        data: { name: newUser.firstName || "User" }
    });

    // ---------------------------------------------------------
    // 8. LOG EVENT
    // ---------------------------------------------------------
    logAuthEvent(
        newUser,
        deviceInput,
        AUTH_LOG_EVENTS.REGISTER,
        `User registered successfully.`,
        null
    );

    return {
        success: true,
        userId: newUser.userId,
        contactMode: contactInfo.contactMode,
        message: "Registration successful. Verification sent."
    };
};

module.exports = { signUpService };