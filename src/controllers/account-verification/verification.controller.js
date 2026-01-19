// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { createToken } = require("@utils/issue-token.util");
const { expiryTimeOfAccessToken } = require("@configs/token.config");
const { buildAccessTokenHeaders } = require("@utils/token-headers.util");
const { 
    throwInternalServerError, 
    throwBadRequestError, 
    getLogIdentifiers 
} = require("@utils/error-handler.util");

// Services Import
const { verifyEmailService, verifyPhoneService } = require("@services/account-verification/verification.service");
const { verifyDeviceService } = require("@services/account-verification/verify-device.service");

/**
 * 🏭 CORE CONTROLLER LOGIC (Factory)
 * Yeh function Email aur Phone dono ke liye same logic chalayega.
 */
const handleContactVerification = async (req, res, serviceFunction, successMessageBase) => {
    try {
        // Middleware ensure karta hai ki foundUser/user set ho
        const user = req.foundUser || req.user;
        const { token, type } = req.body; 
        const device = req.device;

        // 1. Dynamic Service Call
        const { success, autoLoggedIn } = await serviceFunction(user, device, token, type);

        if (success) {
            let additionalMessage = "";

            // 2. Handle Auto Login (Common Logic)
            if (autoLoggedIn) {
                // A. Create Access Token
                const accessToken = createToken(user.userId, expiryTimeOfAccessToken, req.device.deviceUUID);
                
                // B. Build Headers
                const headers = buildAccessTokenHeaders(accessToken);

                if (accessToken && headers) {
                    // C. Set Headers
                    res.set(headers);
                    additionalMessage = " You have been automatically logged in.";
                    logWithTime(`🔄 Auto-login headers set for User ID: ${user.userId}`);
                } else {
                    logWithTime(`⚠️ Auto-login active but failed to set headers for User ID: ${user.userId}`);
                }
            }

            logWithTime(`✅ ${successMessageBase} for User ID: ${user.userId}`);
            
            return res.status(OK).json({
                success: true,
                message: `${successMessageBase} successfully. Your account is now active.` + additionalMessage,
                isAutoLoggedIn: autoLoggedIn 
            });
        }

        return throwBadRequestError(res, "Invalid or expired verification token.");

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        // Error message me context add karne ke liye successMessageBase use kiya
        logWithTime(`❌ Error during ${successMessageBase} for ${getIdentifiers}: ${err.message}`);
        
        if (err.message.includes("expired") || err.message.includes("invalid")) {
            return throwBadRequestError(res, err.message);
        }

        return throwInternalServerError(res, err);
    }
};

// ==========================================
// 🚀 EXPORTED CONTROLLERS (Tiny Wrappers)
// ==========================================

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