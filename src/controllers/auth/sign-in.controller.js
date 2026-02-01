// Modules & Configs
const { performSignIn } = require("@services/auth/sign-in.service");
const { buildAccessTokenHeaders } = require("@utils/token-headers.util");
const { expiryTimeOfAccessToken } = require("@configs/token.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { createToken } = require("@utils/issue-token.util");
const { logWithTime } = require("@utils/time-stamps.util");

// Error Handlers
const {
    throwInternalServerError,
    throwValidationError,
    throwBadRequestError,
    getLogIdentifiers,
    throwTooManyRequestsError,
    throwSpecificInternalServerError
} = require("@/responses/common/error-handler.response");

// Success Handlers
const {
    signInTwoFactorRequiredResponse,
    signInSuccessResponse
} = require("@/responses/success/index");

const signIn = async (req, res) => {
    try {
        const user = req.foundUser;
        const device = req.device;
        const plainPassword = req.body.password;
        const requestId = req.requestId;

        const result = await performSignIn(user, device, plainPassword, requestId);
        
        // RATE LIMIT (2FA resend / password)
        
        if (result.rateLimited) {
            return throwTooManyRequestsError(
                res,
                result.message,
                Math.ceil(
                    (new Date(result.retryAfter).getTime() - Date.now()) / 1000
                )
            );
        }

        // BUSINESS FAILURES
        
        if (!result.success) {

            if (result.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwValidationError(res, {
                    password: result.message
                });
            }

            if (result.type === AuthErrorTypes.ALREADY_LOGGED_IN) {
                return throwBadRequestError(res, result.message);
            }

            if (result.type === AuthErrorTypes.DEVICE_USER_LIMIT_REACHED) {
                return throwBadRequestError(res, result.message);
            }

            if (result.type === AuthErrorTypes.SESSION_LIMIT_REACHED) {
                return throwBadRequestError(res, result.message);
            }

            return throwBadRequestError(res, result.message);
        }
        
        // 2FA REQUIRED
        
        if (result.requires2FA) {
            return signInTwoFactorRequiredResponse(res, result.message);
        }
        
        // ACCESS TOKEN
        
        const accessToken = createToken(
            user.userId,
            expiryTimeOfAccessToken,
            device.deviceUUID
        );

        const headers = buildAccessTokenHeaders(accessToken);

        if (!accessToken || !headers) {
            return throwSpecificInternalServerError(res, "Failed to generate access token");
        }

        res.set(headers);

        return signInSuccessResponse(res, user, device);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Sign-in fatal error ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { signIn };
