// src/services/password-management/password-update.service.js

const { hashPassword } = require("@/utils/auth.util");
const { errorMessage } = require("@/utils/error-handler.util");
const { logWithTime } = require("@/utils/time-stamps.util");

/**
 * Updates the user's password in the database
 * Handles hashing and security field resets
 */

const updatePassword = async (user, newPassword) => {
    try {
        // 1. Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        if (!hashedPassword) {
            logWithTime(`❌ Password Hashing failed for User ${user.userId} in updatePassword service`);
            return false;
        }

        // 2. Update User Fields
        user.password = hashedPassword;
        user.passwordChangedAt = Date.now();

        // 3. Security Cleanup (Good Practice)
        if (user.security) {
            user.security.changePassword.failedAttempts = 0;
            user.security.changePassword.lastAttemptAt = null;
        }

        // 4. Save to Database
        await user.save();

        return true;
    } catch (err) {
        logWithTime(`❌ Error in updatePassword service for userId: (${user.userId})`);
        errorMessage(err);
        return false;
    }
};

module.exports = {
    updatePassword
};