const { passwordSecurity } = require("@configs/security.config");

/**
 * Checks if user is currently locked out
 */
const checkIsUserLocked = (user) => {
    if (user.security.lockoutUntil && user.security.lockoutUntil > Date.now()) {
        const timeRemaining = Math.ceil((user.security.lockoutUntil - Date.now()) / 60000); // in minutes
        return {
            isLocked: true,
            message: `Account is temporarily locked due to multiple failed attempts. Please try again after ${timeRemaining} minutes.`
        };
    }
    
    // Agar time expire ho gaya hai to lock hata do (Logic handle in failure function or here)
    if (user.security.lockoutUntil && user.security.lockoutUntil <= Date.now()) {
         // Auto reset logic handled during next attempt usually, but returning false is enough here
    }

    return { isLocked: false };
};

/**
 * Handles failed password attempt
 * Returns: { isLocked: boolean, remainingAttempts: number, message: string }
 */
const handleFailedPasswordAttempt = async (user) => {
    const { MAX_ATTEMPTS, LOCKOUT_TIME_MINUTES } = passwordSecurity;

    // 1. Agar purana lock time expire ho chuka hai, to reset kar do
    if (user.security.lockoutUntil && user.security.lockoutUntil <= Date.now()) {
        user.security.passwordRetryAttempts = 0;
        user.security.lockoutUntil = null;
    }

    // 2. Increment Attempt
    user.security.passwordRetryAttempts = (user.security.passwordRetryAttempts || 0) + 1;
    
    let isLocked = false;
    let message = "";
    let remainingAttempts = MAX_ATTEMPTS - user.security.passwordRetryAttempts;

    // 3. Check if Limit Reached
    if (user.security.passwordRetryAttempts >= MAX_ATTEMPTS) {
        // Lock the user
        const lockoutTime = new Date(Date.now() + LOCKOUT_TIME_MINUTES * 60 * 1000);
        user.security.lockoutUntil = lockoutTime;
        isLocked = true;
        message = `Maximum attempts exceeded. Account is locked for ${LOCKOUT_TIME_MINUTES} minutes.`;
    } else {
        message = `Invalid Password. You have ${remainingAttempts} attempts remaining.`;
    }

    // 4. Save User
    await user.save();

    return {
        isLocked,
        remainingAttempts: remainingAttempts < 0 ? 0 : remainingAttempts,
        message
    };
};

/**
 * Resets the counter on Successful Login/Change Password
 */
const resetPasswordAttempts = async (user) => {
    if (user.security.passwordRetryAttempts > 0 || user.security.lockoutUntil) {
        user.security.passwordRetryAttempts = 0;
        user.security.lockoutUntil = null;
        await user.save();
    }
};

module.exports = {
    checkIsUserLocked,
    handleFailedPasswordAttempt,
    resetPasswordAttempts
};