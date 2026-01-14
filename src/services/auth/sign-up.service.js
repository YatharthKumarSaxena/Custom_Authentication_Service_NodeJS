const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { makeUserId } = require("@services/userId.service");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { AuthErrorTypes, VerificationPurpose } = require("@configs/enums.config");
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
    const { firstName, email, countryCode, localNumber, password } = userPayload;;

    const query = [];
    let phone = null;
    if (email) query.push({ email: email });
    if (countryCode && localNumber){
        phone = createPhoneNumber(countryCode, localNumber);
        query.push({ phone: phone });
    }

    if (query.length > 0) {
        const existingUser = await UserModel.findOne({ $or: query });
        if (existingUser) {
            throw { 
                type: AuthErrorTypes.RESOURCE_EXISTS, 
                message: "User with this Email or Phone already exists. Please login." 
            };
        }
    }

    // ---------------------------------------------------------
    // 3. GENERATE USER ID & HASH PASSWORD
    // ---------------------------------------------------------
    const generatedUserID = await makeUserId(); 

    if (generatedUserID === "0") {
        throw { type: AuthErrorTypes.SERVER_LIMIT_REACHED, message: "User limit reached (ID Gen Failed)." };
    }else if(!generatedUserID === ""){
        throw { type: AuthErrorTypes.SERVER_ERROR, message: "User ID generation failed." };
    }

    const hashedPassword = hashPassword(password);

    // ---------------------------------------------------------
    // 4. CREATE USER (DB Insert)
    // ---------------------------------------------------------
    const newUser = await UserModel.create({
        userId: generatedUserID,
        firstName: firstName,
        email: email,
        // Phone Object Structure (Schema dependent)
        countryCode: phone?.countryCode,
        localNumber: phone?.number,
        phone: phone, // Unified
        password: hashedPassword,
        // Default flags
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true // User active hai, bas verified nahi
    });

    logWithTime(`🟢 User Created: ${newUser.userId} from device Id : ${deviceInput.deviceUUID}`);
    
    // ---------------------------------------------------------
    // 5. DEVICE HANDLING (Ensure Device Exists)
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
    // 6. GENERATE VERIFICATION (OTP/Link) 🔥
    // ---------------------------------------------------------
    // Pata lagao contact mode kya hai (Email/Phone/Both)
    const { contactMode } = getUserContacts(newUser);

    // Verification Generator Call
    // Note: Hum yahan ACCOUNT_ACTIVATION ya EMAIL_VERIFICATION purpose use kar sakte hain
    await generateVerificationForUser(
        newUser,
        deviceDoc._id,
        VerificationPurpose.REGISTRATION, // Ya AuthMode ke hisab se dynamic
        contactMode,
        verificationSecurity[VerificationPurpose.REGISTRATION].MAX_ATTEMPTS,
        verificationSecurity[VerificationPurpose.REGISTRATION].LINK_EXPIRY_MINUTES * 60
    );

    // ---------------------------------------------------------
    // 7. LOG EVENT
    // ---------------------------------------------------------
    logAuthEvent(newUser, deviceDoc, AUTH_LOG_EVENTS.REGISTER, `User with ID ${newUser.userId} Registered on device Id : ${deviceInput.deviceUUID}`, null);

    return {
        success: true,
        userId: newUser.userId,
        contactMode: contactMode,
        message: "Registration successful. Please verify your account to continue."
    };
};

module.exports = { signUpService };