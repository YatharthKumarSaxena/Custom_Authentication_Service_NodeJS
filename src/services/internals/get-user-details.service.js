const { UserModel } = require("@models/user.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { getUserContacts } = require("@utils/contact-selector.util"); // Reusing your util
const { logWithTime } = require("@utils/time-stamps.util");
const { IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { AuthErrorTypes } = require("@configs/enums.config");

/**
 * Service to fetch USER DETAILS for ADMIN
 * Logic: Shows complete data but respects Auth Modes & Security Configs.
 */
const getUserFullDetailsService = async (targetUserId) => {
    
    // 1. Fetch User Profile (Exclude Sensitive Fields)
    const user = await UserModel.findOne({ userId: targetUserId })
        .select("-password -security -__v") // Password/Security hidden
        .lean();

    if (!user) {
        throw { 
            type: AuthErrorTypes.RESOURCE_NOT_FOUND, 
            message: `User with ID ${targetUserId} not found.` 
        };
    }

    // 2. Fetch Latest Session Info (Optimized DB Query) ⚡
    // Hum JS reduce ki jagah DB se hi sort karke maangenge (Faster)
    let lastLoginAt = "N/A";
    let lastLogoutAt = "N/A";

    try {
        const latestSession = await UserDeviceModel.findOne(
            { userId: user._id },
            { lastLoginAt: 1, lastLogoutAt: 1 }
        )
        .sort({ lastLoginAt: -1 }) // Get the most recent one
        .lean();

        if (latestSession) {
            lastLoginAt = latestSession.lastLoginAt || "N/A";
            lastLogoutAt = latestSession.lastLogoutAt || "N/A";
        }
    } catch (error) {
        logWithTime(`⚠️ DB Error fetching sessions for ${targetUserId}. Skipping session info.`);
    }

    // 3. Prepare Base Response
    let userDetails = {
        "User ID": user.userId,
        "Name": user.firstName,
        "Role": user.userType, // Admin ko role pata hona chahiye
        
        // Status Flags
        "Status": user.isActive ? "Active" : "Inactive",
        "Is Blocked": user.isBlocked ? "YES" : "No",
        
        // Timelines
        "Registered At": user.createdAt,
        "Details Updated At": user.updatedAt,
        "Last Login": lastLoginAt,
        "Last Logout": lastLogoutAt
    };

    // 4. Dynamic Contact Info (Based on Auth Mode)
    // 'getUserContacts' util handle karega ki email hai ya phone
    const { email, phone } = getUserContacts(user);

    if (email) {
        userDetails["Email"] = email;
        userDetails["Email Verified"] = user.isEmailVerified ? "Yes" : "No";
    }

    if (phone) {
        userDetails["Phone"] = phone;
        userDetails["Phone Verified"] = user.isPhoneVerified ? "Yes" : "No";
    }

    // 5. Dynamic 2FA Info (Based on Security Config)
    if (IS_TWO_FA_FEATURE_ENABLED) {
        userDetails["2FA Enabled"] = user.twoFactorEnabled ? "Yes" : "No"; // Schema match: twoFactorEnabled
        
        if (user.twoFactorEnabled) {
            userDetails["2FA Enabled At"] = user.twoFactorEnabledAt || "N/A";
        }
        if (user.twoFactorDisabledAt) {
            userDetails["2FA Last Disabled At"] = user.twoFactorDisabledAt;
        }
    }

    // 6. Extra Timeline Info (If available)
    if (user.passwordChangedAt) userDetails["Password Last Changed"] = user.passwordChangedAt;
    if (user.lastActivatedAt) userDetails["Last Activated"] = user.lastActivatedAt;
    if (user.lastDeactivatedAt) userDetails["Last Deactivated"] = user.lastDeactivatedAt;

    return userDetails;
};

module.exports = { getUserFullDetailsService };