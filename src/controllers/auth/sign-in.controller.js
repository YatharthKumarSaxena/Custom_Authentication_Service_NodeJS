// Modules & Configs
const { performSignIn } = require("@services/auth/sign-in.service");
const { buildAccessTokenHeaders } = require("@utils/token-headers.util");
const { expiryTimeOfAccessToken } = require("@configs/token.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { OK } = require("@configs/http-status.config");
const { createToken } = require("@utils/issue-token.util");
const { logWithTime } = require("@utils/time-stamps.util");

// Error Handlers
const { 
    throwInternalServerError, 
    throwValidationError,
    throwBadRequestError, 
    getLogIdentifiers
} = require("@utils/error-handler.util");

/**
 * Sign In Controller
 * Delegates logic to auth.service.js
 */
const signIn = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const plainPassword = req.body.password;
        // ---------------------------------------------------------
        // 1. ORCHESTRATION (Call Service)
        // ---------------------------------------------------------
        // Ye function check karega: Already Login? -> Password Valid? -> Session Create -> Cookie Set
        await performSignIn(user, device, plainPassword);

        // ---------------------------------------------------------
        // 2. ACCESS TOKEN GENERATION (Response Header)
        // ---------------------------------------------------------
        // Refresh token secure cookie me hai (Service ne set kar diya).
        // Access token hum yahan header ke liye banayenge.
        const accessToken = createToken(req.user.userId, expiryTimeOfAccessToken, req.device.deviceUUID);
        
        const headers = buildAccessTokenHeaders(accessToken);

        if (!accessToken || !headers) {
            throw new Error("Failed to generate or set access token headers.");
        }

        // Set Headers
        res.set(headers);

        // ---------------------------------------------------------
        // 3. SUCCESS RESPONSE
        // ---------------------------------------------------------

        const praiseBy = user.firstName || "User";

        logWithTime(`✅ User (${user.userId}) signed in successfully on device (${device.deviceUUID}).`);

        return res.status(OK).json({
            success: true,
            message: `Welcome ${praiseBy}, You are successfully logged in.`
        });

    } catch (err) {
        // ---------------------------------------------------------
        // ERROR HANDLING (Map Service Errors to HTTP Responses)
        // ---------------------------------------------------------
        
        // 1. User Locked (423)
        if (err.type === AuthErrorTypes.LOCKED) {
            return throwBadRequestError(res, err.message);
        }
        
        // 2. Invalid Password (400/401)
        if (err.type === AuthErrorTypes.INVALID_PASSWORD) {
            return throwValidationError(res, { password: err.message });
        }
        
        // 3. Already Logged In (400)
        if (err.type === AuthErrorTypes.ALREADY_LOGGED_IN) {
            return throwBadRequestError(res, err.message);
        }

        // 4. Unknown/Internal Errors (500)
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ SignIn Error ${getIdentifiers}:`); 
        return throwInternalServerError(res, err);
    }
}

module.exports = { signIn };