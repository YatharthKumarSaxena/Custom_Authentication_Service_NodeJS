const { checkPasswordIsValid } = require("@/utils/auth.util");
const { checkIsUserLocked, handleFailedPasswordAttempt, resetPasswordAttempts } = require("@/utils/password-limiter.util");
const { AuthErrorTypes } = require("@configs/enums.config"); // Import Enum
const { UserModel } = require("@models/user.model");

const verifyPasswordWithRateLimit = async (user, plainPassword, context) => {

    // 1. Check Lock Status
    const userForAuth = await UserModel
        .findById(user._id)
        .select("+password +security");

    const lockStatus = checkIsUserLocked(userForAuth, context);
    if (lockStatus.isLocked) {
        // Service throws specific error type
        throw {
            type: AuthErrorTypes.LOCKED,
            message: lockStatus.message
        };
    }

    // 2. Validate Password
    const isPasswordValid = await checkPasswordIsValid(user.userId, plainPassword);

    // 3. Handle Invalid Password
    if (!isPasswordValid) {
        const failureResult = await handleFailedPasswordAttempt(userForAuth, context);

        if (failureResult.isLocked) {
            throw {
                type: AuthErrorTypes.LOCKED,
                message: failureResult.message
            };
        } else {
            throw {
                type: AuthErrorTypes.INVALID_PASSWORD,
                message: failureResult.message // "Invalid Password. 2 attempts remaining."
            };
        }
    }

    // 4. Success -> Reset
    await resetPasswordAttempts(user);
    return true;
};

module.exports = { verifyPasswordWithRateLimit };