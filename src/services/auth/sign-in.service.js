const { UserDeviceModel } = require("@/models/user-device.model");
const { DeviceModel } = require("@/models/device.model");
const { loginUserOnDevice } = require("./auth-session.service"); // Login Service
const { createToken } = require("@utils/issue-token.util");
const { AuthErrorTypes, VerificationPurpose } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const ms = require("ms");
const { getUserContacts } = require("@/utils/contact-selector.util");
const { verificationSecurity, IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { verifyPasswordWithRateLimit } = require("../password-management/password-verification.service");

/*
 * Main Orchestrator for Sign In
 */

const performSignIn = async (user, deviceInput, plainPassword) => {

    // ---------------------------------------------------------
    // STEP 1: Check if User is ALREADY Logged In (AND Token is Valid)
    // ---------------------------------------------------------
    const existingDevice = await DeviceModel.findOne({ deviceUUID: deviceInput.deviceUUID });

    if (existingDevice) {
        const activeSession = await UserDeviceModel.findOne({
            userId: user._id,
            deviceId: existingDevice._id,
            refreshToken: { $ne: null }
        });

        if (activeSession) {
            // 🔥 LOGIC FIX: Check if token is actually valid or expired

            // 1. Convert config expiry (e.g. '7d') to Milliseconds
            const expiryDurationMs = ms(expiryTimeOfRefreshToken);

            // 2. Calculate Token Age
            const issuedAt = new Date(activeSession.jwtTokenIssuedAt).getTime();
            const now = Date.now();

            // 3. Check Validity
            // Agar (Abhi ka time) < (Issued Time + 7 Days) hai, tabhi wo Active hai.
            const isValid = now < (issuedAt + expiryDurationMs);

            if (isValid) {
                // 🛑 Token zinda hai, Login Block karo
                logWithTime(`⚠️ Login Blocked: User (${user.userId}) already active on device (${deviceInput.deviceUUID})`);
                throw {
                    type: AuthErrorTypes.ALREADY_LOGGED_IN,
                    message: "You are already logged in on this device. Please logout first."
                };
            } else {
                // ✅ Token Expire ho chuka hai (Old session)
                // Ise ignore karo, aage badho aur naya token overwrite kar do.
                logWithTime(`ℹ️ Found expired session for User (${user.userId}). Proceeding with new login.`);
            }
        }
    }

    // ---------------------------------------------------------
    // STEP 2: Verify Password
    // ---------------------------------------------------------
    await verifyPasswordWithRateLimit(user, plainPassword);

    if (IS_TWO_FA_FEATURE_ENABLED && user.twoFactorEnabled) {
        logWithTime(`🔒 2FA is enabled for User (${user.userId}). Initiating verification.`);

        const { contactMode } = getUserContacts(user);

        let targetDeviceId;

        if (existingDevice) {
            // Case A: Device already exists
            targetDeviceId = existingDevice._id;
        } else {
            // Case B: New Device -> Create (Upsert is safe for race conditions)
            const newDevice = await DeviceModel.findOneAndUpdate(
                { deviceUUID: deviceInput.deviceUUID }, // Find by UUID
                {
                    deviceName: deviceInput.deviceName,
                    deviceType: deviceInput.deviceType
                    // UUID will be automatically set if inserted
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            targetDeviceId = newDevice._id;
        }

        // A. Send OTP (to Email/Phone)
        await generateVerificationForUser(
            user,
            targetDeviceId,
            VerificationPurpose.DEVICE_VERIFICATION,
            contactMode,
            verificationSecurity[VerificationPurpose.DEVICE_VERIFICATION].MAX_ATTEMPTS,
            verificationSecurity[VerificationPurpose.DEVICE_VERIFICATION].LINK_EXPIRY_MINUTES * 60
        );

        // B. Stop Login (Return specific response)

        return {
            success: true,
            requires2FA: true,
            message: "Two-factor authentication enabled. Please verify your device."
        };
    }

    // ---------------------------------------------------------
    // STEP 3: Generate Token String
    // ---------------------------------------------------------
    const refreshToken = createToken(user.userId, expiryTimeOfRefreshToken, deviceInput.deviceUUID);
    if (!refreshToken) {
        throw new Error("Token generation failed");
    }

    // ---------------------------------------------------------
    // STEP 4: Call Login Session Service
    // ---------------------------------------------------------
    const loginSuccess = await loginUserOnDevice(user, deviceInput, refreshToken, "Standard Sign-In");

    if (!loginSuccess) {
        throw new Error("Login session creation failed internal error");
    }

    // ✅ Return Object (Consistent with 2FA return)
    return {
        success: true,
        requires2FA: false,
        message: "Login successful."
    };
};

module.exports = { performSignIn };