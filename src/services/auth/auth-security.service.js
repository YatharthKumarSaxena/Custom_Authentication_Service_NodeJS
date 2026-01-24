const { passwordSecurity } = require("@configs/security.config");
const { getSecurityBucket } = require("../../utils/security-context.util");

const checkIsUserLocked = (user, context) => {
    const bucket = getSecurityBucket(user, context);

    if (bucket.lockoutUntil && bucket.lockoutUntil > Date.now()) {
        const mins = Math.ceil((bucket.lockoutUntil - Date.now()) / 60000);

        return {
            isLocked: true,
            message: `Account locked. Try again after ${mins} minutes.`
        };
    }

    return { isLocked: false };
};

const handleFailedPasswordAttempt = async (user, context) => {
    const bucket = getSecurityBucket(user, context);
    const { MAX_ATTEMPTS, LOCKOUT_TIME_MINUTES } = passwordSecurity;

    // reset expired lock
    if (bucket.lockoutUntil && bucket.lockoutUntil <= Date.now()) {
        bucket.failedAttempts = 0;
        bucket.lockoutUntil = null;
    }

    bucket.failedAttempts += 1;

    let message;
    let isLocked = false;

    if (bucket.failedAttempts >= MAX_ATTEMPTS) {
        bucket.lockoutUntil =
            new Date(Date.now() + LOCKOUT_TIME_MINUTES * 60 * 1000);

        isLocked = true;
        message = `Account locked for ${LOCKOUT_TIME_MINUTES} minutes.`;
    } else {
        message = `Invalid password. ${MAX_ATTEMPTS - bucket.failedAttempts} attempts left.`;
    }

    await user.save({ validateBeforeSave: false });

    return { isLocked, message };
};

const resetPasswordAttempts = async (user, context) => {
    const bucket = getSecurityBucket(user, context);

    if (bucket.failedAttempts > 0 || bucket.lockoutUntil) {
        bucket.failedAttempts = 0;
        bucket.lockoutUntil = null;
        await user.save({ validateBeforeSave: false });
    }
};

module.exports = {
    checkIsUserLocked,
    handleFailedPasswordAttempt,
    resetPasswordAttempts
};
