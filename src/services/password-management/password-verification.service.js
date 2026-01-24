const { checkPasswordIsValid } = require("@utils/auth.util");
const {
    checkIsUserLocked,
    handleFailedPasswordAttempt,
    resetPasswordAttempts
} = require("@services/auth/auth-security.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { UserModel } = require("@models/user.model");

const verifyPasswordWithRateLimit = async (user, plainPassword, context) => {

    // 1️⃣ Fetch fresh security + password
    const userForAuth = await UserModel
        .findById(user._id)
        .select("+password +security");

    // 2️⃣ Check lock status
    const lockStatus = checkIsUserLocked(userForAuth, context);

    if (lockStatus.isLocked) {
        return {
            success: false,
            type: AuthErrorTypes.LOCKED,
            message: lockStatus.message
        };
    }

    // 3️⃣ Verify password
    const isPasswordValid = await checkPasswordIsValid(
        user.userId,
        plainPassword
    );

    if (!isPasswordValid) {

        const failureResult = await handleFailedPasswordAttempt(
            userForAuth,
            context
        );

        return {
            success: false,
            type: failureResult.isLocked
                ? AuthErrorTypes.LOCKED
                : AuthErrorTypes.INVALID_PASSWORD,
            message: failureResult.message
        };
    }

    // 4️⃣ Success → reset counters
    await resetPasswordAttempts(userForAuth);

    return {
        success: true
    };
};

module.exports = { verifyPasswordWithRateLimit };