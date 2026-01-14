// Modules & Configs
const { CREATED } = require("@configs/http-status.config");
const { signUpService } = require("@services/auth/sign-up.service");
const { AuthErrorTypes } = require("@configs/enums.config");

// Error Handlers
const { 
    throwInternalServerError, 
    throwConflictError, 
    getLogIdentifiers,
    throwSpecificInternalServerError
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Sign Up Controller
 * Orchestrates user registration and triggers verification
 */
const signUp = async (req, res) => {
    try {
        const deviceInput = req.device; // Provided by device detection middleware
        const userPayload = req.body;   // Raw user data from body

        // ---------------------------------------------------------
        // 1. ORCHESTRATION (Call Service)
        // ---------------------------------------------------------
        // This will handle duplicate checks, ID generation, hashing, 
        // DB creation, and OTP triggering.
        const result = await signUpService(deviceInput, userPayload);

        // ---------------------------------------------------------
        // 2. SUCCESS RESPONSE
        // ---------------------------------------------------------
        logWithTime(`✅ SignUp Initialized: User (${result.userId}) on device (${deviceInput.deviceUUID})`);

        return res.status(CREATED).json({
            success: true,
            message: result.message,
            data: {
                userId: result.userId,
                contactMode: result.contactMode,
                nextStep: "VERIFICATION_REQUIRED"
            }
        });

    } catch (err) {
        // ---------------------------------------------------------
        // ERROR HANDLING (Mapping Service Errors to HTTP Status)
        // ---------------------------------------------------------
        
        // A. User/Email/Phone already exists (409 Conflict)
        if (err.type === AuthErrorTypes.RESOURCE_EXISTS) {
            logWithTime(`⚠️ Registration Failed: ${err.message}`);
            return throwConflictError(res, err.message);
        }

        // B. Machine Capacity Full (507 Insufficient Storage or 400)
        if (err.type === AuthErrorTypes.SERVER_LIMIT_REACHED) {
            logWithTime(`🛑 Registration Blocked: Server capacity reached.`);
            return throwSpecificInternalServerError(res, err.message);
        }

        // C. Specific Service Errors (ID generation failed etc.)
        if (err.type === AuthErrorTypes.SERVER_ERROR) {
            logWithTime(`❌ Service Error: ${err.message}`);
            return throwInternalServerError(res, err);
        }

        // D. Generic Catch-all
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Unexpected SignUp Error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { signUp };