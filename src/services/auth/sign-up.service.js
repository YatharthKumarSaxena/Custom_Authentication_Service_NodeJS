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

/**
 * Service to Register User & Initiate Verification
 * NO AUTO LOGIN HERE.
 */

const signUpService = async (deviceInput, userPayload) => {

    const {
        email,
        countryCode,
        localNumber,
        phone,
        firstName,
        password
    } = userPayload;

    // ---------------------------------------------------------
    // 1. GENERATE USER ID & HASH PASSWORD
    // ---------------------------------------------------------

    const hashedPassword = await hashPassword(password);

    const generatedUserID = await makeUserId();

    if (generatedUserID === "0") {
        throw { type: AuthErrorTypes.SERVER_LIMIT_REACHED, message: "User limit reached (ID Gen Failed)." };
    } else if (!generatedUserID === "") {
        throw { type: AuthErrorTypes.SERVER_ERROR, message: "User ID generation failed." };
    }

    // ---------------------------------------------------------
    // 2. CREATE USER (DB Insert)
    // ---------------------------------------------------------

    // normalize values (VERY IMPORTANT)
    const safeEmail = email?.trim() || undefined;
    const safeCountryCode = countryCode?.trim() || undefined;
    const safeLocalNumber = localNumber?.trim() || undefined;
    const safePhone = phone?.trim() || undefined;

    // build object dynamically
    const userData = {
        userId: generatedUserID,
        firstName,
        password: hashedPassword,
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true
    };

    if (safeEmail) {
        userData.email = safeEmail;
    }

    if (safeCountryCode && safeLocalNumber && safePhone) {
        userData.countryCode = safeCountryCode;
        userData.localNumber = safeLocalNumber;
        userData.phone = safePhone;
    }

    const newUser = await UserModel.create(userData);


    logWithTime(`🟢 User Created: ${newUser.userId} from device Id : ${deviceInput.deviceUUID}`);

    // ---------------------------------------------------------
    // 3. DEVICE HANDLING (Ensure Device Exists)
    // ---------------------------------------------------------
    // Verification ke liye Device ID chahiye hoti hai
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: deviceInput.deviceUUID },
        {
            deviceName: deviceInput.deviceName,
            deviceType: deviceInput.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ---------------------------------------------------------
    // 4. GENERATE VERIFICATION (OTP/Link) 🔥
    // ---------------------------------------------------------
    const contactInfo = getUserContacts(newUser);

    // Generate verification token (NO email dispatch inside)
    const verificationResult = await generateVerificationForUser(
        newUser,
        deviceDoc._id,
        VerificationPurpose.REGISTRATION,
        contactInfo.contactMode,
        verificationSecurity[VerificationPurpose.REGISTRATION].MAX_ATTEMPTS,
        verificationSecurity[VerificationPurpose.REGISTRATION].LINK_EXPIRY_MINUTES * 60
    );

    if (!verificationResult) {
        throw new Error("Failed to generate verification token. Please try again.");
    }

    // ---------------------------------------------------------
    // 5. SEND VERIFICATION NOTIFICATION (Fire and Forget)
    // ---------------------------------------------------------
    const { type, token } = verificationResult;
    
    // Debug log to check what's being generated
    logWithTime(`🔍 DEBUG: Generated ${type} with token: ${token.substring(0, 10)}...`);
    
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

    // ---------------------------------------------------------
    // 6. SEND REGISTRATION SUCCESS NOTIFICATION (Fire and Forget - Compulsory)
    // ---------------------------------------------------------
    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.registrationSuccess,
        smsTemplate: userSmsTemplate.registrationSuccess,
        data: { name: newUser.firstName || "User" }
    });

    // ---------------------------------------------------------
    // 7. LOG EVENT
    // ---------------------------------------------------------
    logAuthEvent(newUser, deviceInput, AUTH_LOG_EVENTS.REGISTER, `User with ID ${newUser.userId} Registered on device Id : ${deviceInput.deviceUUID}`, null);

    return {
        success: true,
        userId: newUser.userId,
        contactMode: contactInfo.contactMode,
        message: "Registration successful. Verification code sent. Please verify your account to continue."
    };
};

module.exports = { signUpService };