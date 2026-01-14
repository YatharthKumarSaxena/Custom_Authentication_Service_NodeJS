const { IS_TWO_FA_FEATURE_ENABLED } = require("@/configs/security.config");
const { getUserContacts } = require("@/utils/contact-selector.util");
const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Service to fetch combined account and session details
 */
const getAccountDetailsService = async (user) => {
    let deviceSessions = [];

    // 1. Fetch all device sessions for the user (DB CALL)
    try {
        deviceSessions = await UserDeviceModel.find(
            { userId: user._id },
            { lastLoginAt: 1, lastLogoutAt: 1 }
        ).lean();
    } catch (error) {
        logWithTime(`❌ DB Error while fetching device sessions for User: ${user.userId}`);
        logWithTime(error.message);
        return null;
    }

    // 2. Find the most recent login across all devices
    let lastLoginAt = "N/A";
    let lastLogoutAt = "N/A";

    if (deviceSessions.length > 0) {
        const latestSession = deviceSessions.reduce((latest, current) => {
            if (!latest.lastLoginAt) return current;
            if (!current.lastLoginAt) return latest;
            return new Date(current.lastLoginAt) > new Date(latest.lastLoginAt)
                ? current
                : latest;
        });

        lastLoginAt = latestSession.lastLoginAt || "N/A";
        lastLogoutAt = latestSession.lastLogoutAt || "N/A";
    }

    const { email, phone } = getUserContacts(user);

    // 3. Format account details response
    let accountDetails = {
        "User ID": user.userId,
        "First Name": user.firstName,

        "Account Status": user.isActive ? "Activated" : "Deactivated",
        "Blocked Account": user.isBlocked ? "Yes" : "No",

        // Timeline clarity
        "Account Created At": user.createdAt,
        "Last Login At": lastLoginAt,
        "Last Logout At": lastLogoutAt
    };

    if (email) {
        accountDetails["Email"] = email;
        accountDetails["isEmailVerified"] = user.isEmailVerified ? "Yes" : "No";
    }

    if (phone) {
        accountDetails["Phone"] = phone;
        accountDetails["isPhoneVerified"] = user.isPhoneVerified ? "Yes" : "No";
    }

    if (IS_TWO_FA_FEATURE_ENABLED) {
        accountDetails["2FA Enabled"] = user.isTwoFactorEnabled ? "Yes" : "No";
        if (user.twoFactorEnabledAt) accountDetails["2FA Enabled At"] = user.twoFactorEnabledAt;
    }

    // 4. Optional timeline fields
    if (user.passwordChangedAt) accountDetails["Password Changed At"] = user.passwordChangedAt;
    if (user.lastActivatedAt) accountDetails["Last Activated At"] = user.lastActivatedAt;
    if (user.lastDeactivatedAt) accountDetails["Last Deactivated At"] = user.lastDeactivatedAt;

    logWithTime(`✅ Profile details provided for User: ${user.userId}`);

    return accountDetails;
};

module.exports = { getAccountDetailsService };
