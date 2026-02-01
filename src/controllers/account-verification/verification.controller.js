const { logWithTime } = require("@utils/time-stamps.util");
const { createToken } = require("@utils/issue-token.util");
const { expiryTimeOfAccessToken } = require("@configs/token.config");
const { buildAccessTokenHeaders } = require("@utils/token-headers.util");
const { AuthErrorTypes } = require("@configs/enums.config");
const {
    throwInternalServerError,
    throwBadRequestError,
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");

const {
    verificationAlreadyVerifiedResponse,
    verificationSuccessWithAutoLoginResponse,
    verificationSuccessWithLimitReachedResponse
} = require("@/responses/success/index");

// Services Import
const { verifyEmailService, verifyPhoneService } = require("@services/account-verification/verification.service");
const { verifyDeviceService } = require("@services/account-verification/verify-device.service");
const { getUserContacts } = require("@utils/contact-selector.util");

/**
 * CORE CONTROLLER LOGIC (Factory)
 * Yeh function Email aur Phone dono ke liye same logic chalayega.
 */
const handleContactVerification = async (req, res, serviceFunction, successMessageBase) => {
    try {
        // Middleware ensure karta hai ki foundUser/user set ho
        const user = req.foundUser;
        const { code } = req.body;
        const device = req.device;
        const requestId = req.requestId;

        // Get contactMode from getUserContacts (instead of req.body.type)
        const { contactMode } = getUserContacts(user);

        logWithTime(`🔍 Initiating ${successMessageBase} process for User ID: ${user.userId} via ${contactMode}`);
        // 1. Dynamic Service Call
        const result = await serviceFunction(user, device, requestId, code, contactMode);

        const { success } = result;

        if (success) {
            // Handle specific error types
            if (result.type === AuthErrorTypes.ALREADY_VERIFIED) {
                return verificationAlreadyVerifiedResponse(res, result.message);
            }
            const { autoLoggedIn } = result;

            // 2. Handle Auto Login (Common Logic)
            if (autoLoggedIn) {
                // A. Create Access Token
                const accessToken = createToken(user.userId, expiryTimeOfAccessToken, req.device.deviceUUID);

                // B. Build Headers
                const headers = buildAccessTokenHeaders(accessToken);

                if (accessToken && headers) {
                    // C. Set Headers
                    res.set(headers);
                    logWithTime(`🔄 Auto-login headers set for User ID: ${user.userId}`);
                } else {
                    logWithTime(`⚠️ Auto-login active but failed to set headers for User ID: ${user.userId}`);
                }
            }

            logWithTime(`✅ ${successMessageBase} for User ID: ${user.userId}`);

            return verificationSuccessWithAutoLoginResponse(res, successMessageBase, autoLoggedIn);
        }

        if (!success) {
            
            // Handle device/session limit errors (when auto-login fails due to policy)
            if (result.type === AuthErrorTypes.DEVICE_USER_LIMIT_REACHED) {
                logWithTime(`⚠️ ${successMessageBase} completed but auto-login blocked: Device user limit reached for User ID: ${user.userId}`);
                return verificationSuccessWithLimitReachedResponse(res, successMessageBase, result);
            }
            
            if (result.type === AuthErrorTypes.SESSION_LIMIT_REACHED) {
                logWithTime(`⚠️ ${successMessageBase} completed but auto-login blocked: Session limit reached for User ID: ${user.userId}`);
                return verificationSuccessWithLimitReachedResponse(res, successMessageBase, result);
            }
        }

        const { message } = result;
        logWithTime(`❌ ${successMessageBase} failed for User ID: ${user.userId} from device (${device.deviceUUID}).`);
        return throwBadRequestError(res, `${message}`);

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error during ${successMessageBase} for ${getIdentifiers}`);
        return throwInternalServerError(res, err);
    }
};

// EXPORTED CONTROLLERS (Tiny Wrappers)

const verifyEmail = async (req, res) => {
    return await handleContactVerification(
        req,
        res,
        verifyEmailService, // Pass Service Function
        "Email verified"    // Pass Context String
    );
};

const verifyPhone = async (req, res) => {
    return await handleContactVerification(
        req,
        res,
        verifyPhoneService, // Pass Service Function
        "Phone verified"    // Pass Context String
    );
};

const verifyDevice = async (req, res) => {
    // Factory Controller Logic (Jo humne pichle step me banaya tha)
    return await handleContactVerification(
        req,
        res,
        verifyDeviceService, // Pass the NEW separate service
        "Device verified"
    );
};

module.exports = { verifyEmail, verifyPhone, verifyDevice };