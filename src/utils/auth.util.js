const { errorMessage, throwInternalServerError, throwInvalidResourceError } = require("../configs/error-handler.configs");
const { logWithTime } = require("./time-stamps.util");
const { UserModel }  = require("@models/user.model");
const bcryptjs = require("bcryptjs");
const { BAD_REQUEST } = require("../configs/http-status.config");
const { isValidRegex, validateLength } = require("./field-validators.util");
const { fullPhoneNumberRegex, userIdRegex } = require("../configs/regex.config");
const { fullPhoneNumberLength } = require("../configs/fields-length.config");
const { adminIdPrefix } = require("@/configs/id-prefixes.config");
const { UserDeviceModel } = require("@models/user-device.model");

// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
const checkUserExists = async (emailID, fullPhoneNumber, res) => {
    try {
        let count = 0;
        let user = await UserModel.findOne({ fullPhoneNumber: fullPhoneNumber })
        let reason = "";
        if (user) {
            logWithTime("⚠️ User Already Exists with Phone Number: " + fullPhoneNumber);
            reason = "Phone Number: " + fullPhoneNumber;
            count++;
        }
        user = await UserModel.findOne({ emailID: emailID });
        if (user) {
            logWithTime("⚠️ User Already Exists with Email ID: " + emailID);
            if (count) reason = "Phone Number: " + fullPhoneNumber + " and Email ID: " + emailID;
            else reason = "Email ID: " + emailID;
            count++;
        }
        if (count !== 0) logWithTime("⚠️ Invalid Registration");
        return reason;
    } catch (err) {
        logWithTime(`❌ An Internal Error occurred while checking existing user with phone number: (${fullPhoneNumber}) and emailID: (${emailID}).`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

const checkAndAbortIfUserExists = async (emailID, fullPhoneNumber, res) => {
    const userExistReason = await checkUserExists(emailID, fullPhoneNumber, res);
    if (userExistReason !== "") {
        logWithTime(`⛔ Conflict Detected: ${userExistReason}`);
        if (!res.headersSent) {
            res.status(BAD_REQUEST).json({
                success: false,
                message: "User Already Exists with " + userExistReason,
                warning: "Use different Email ID or Phone Number or both based on Message"
            });
        }
        return true; // signal that response is already sent or conflict detected
    }
    return false;
};

const checkPasswordIsValid = async (userId, providedPassword) => {
    const user = await UserModel
        .findOne({ userId })
        .select("+password");

    if (!user) return false;

    return await bcryptjs.compare(providedPassword, user.password);
};

const isAdminId = (userId) =>
    typeof userId === "string" &&
    isValidRegex(userId, userIdRegex) &&
    userId.startsWith(adminIdPrefix);

const createFullPhoneNumber = (req, res) => {
    try {
        const { countryCode, number } = req.body.phoneNumber;
        const newNumber = "+" + countryCode + number;
        if (!validateLength(newNumber, fullPhoneNumberLength.min, fullPhoneNumberLength.max)) {
            const userId = req.user.userId || "Unauthorized User";
            logWithTime(`Invalid Full Phone Number Length provided by ${userId} to update full phone number`);
            throwInvalidResourceError(res, `Full Phone Number, Full Phone Number must be at least ${fullPhoneNumberLength.min} digits long and not more than ${fullPhoneNumberLength.max} digits`);
            return null;
        }
        if (!isValidRegex(newNumber, fullPhoneNumberRegex)) {
            const userId = req?.user?.userId || "New User";
            logWithTime(`Invalid Full Phone Number Format provided by ${userId} to update full phone number`);
            throwInvalidResourceError(
                res,
                "Full phone number Format, Please enter a valid full phone number that consist of only numeric digits .",
            );
            return null;
        }
        const userId = req.user?.userId || req?.foundUser?.userId || "New User";
        logWithTime(`Full Phone Number Created Successfully for User with ${userId}`)
        return newNumber;
    } catch (err) {
        const userId = req.user?.userId || req?.foundUser?.userId || "New User";
        logWithTime(`An Error Occurred while creating full phone number for User with ${userId}`);
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

const loginTheUser = async (user, refreshToken, device, res) => {
    try {
        user.refreshToken = refreshToken;
        user.isVerified = true;
        user.lastLogin = Date.now();
        user.loginCount += 1;
        user.devices.info.push(device);
        await user.save();
        return true;
    } catch (err) {
        logWithTime(`❌ Internal Error occurred while logging in user (${user.userId})`);
        throwInternalServerError(res, err);
        return false;
    }
};

const logoutUserCompletelyCore = async (user) => {
    try {
        // Step 1: Fetch all active devices for this user
        const devices = await UserDeviceModel.find({ userId: user._id, refreshToken: { $ne: null } });

        let allDevicesLoggedOut = true;

        for (const device of devices) {
            try {
                device.refreshToken = null;
                device.jwtTokenIssuedAt = null;
                device.lastLogoutAt = new Date();
                await device.save();
            } catch (err) {
                allDevicesLoggedOut = false;
                logWithTime(`⚠️ Failed to logout device (${device._id}) for user (${user.userId})`);
            }
        }

        if (!allDevicesLoggedOut) {
            logWithTime(`⚠️ Some devices for user (${user.userId}) could not be logged out.`);
            return false; // avoid updating core flags if not all devices logged out
        }

        // Step 2: Update user core flags only after all devices are logged out
        user.refreshToken = null;
        user.jwtTokenIssuedAt = null;
        user.isVerified = false;
        if (user.devices && user.devices.info) user.devices.info = [];
        await user.save();

        logWithTime(`✅ User (${user.userId}) logged out from all devices successfully.`);
        return true;

    } catch (err) {
        logWithTime(`❌ Internal error while logging out user (${user.userId}) from all devices`);
        errorMessage(err);
        return false;
    }
};

// 🧠 auth.controller.js or auth.service.js
const logoutUserCompletely = async (user, req, res, context = "general") => {
    try {
        user.refreshToken = null;
        user.isVerified = false;
        user.devices.info = [];
        user.jwtTokenIssuedAt = null;
        user.lastLogout = Date.now();

        const isCookieCleared = clearRefreshTokenCookie(res);
        if (!isCookieCleared) {
            logWithTime(`❌ Cookie clear failed for user (${user.userId}) during ${context}. Device ID: (${req.deviceID})`);
            return false;
        }

        await user.save();
        logWithTime(`👋 User (${user.userId}) logged out successfully from all devices during ${context}. Device ID: (${req.deviceID})`);
        return true;
    } catch (err) {
        logWithTime(`❌ Error while logging out user (${user.userId}) during ${context}. Device ID: (${req.deviceID})`);
        errorMessage(err);
        throwInternalServerError(res);
        return false;
    }
};

module.exports = {
    checkAndAbortIfUserExists: checkAndAbortIfUserExists,
    logoutUserCompletelyCore: logoutUserCompletelyCore,
    loginTheUser: loginTheUser,
    logoutUserCompletely: logoutUserCompletely,
    createFullPhoneNumber: createFullPhoneNumber,
    checkPasswordIsValid: checkPasswordIsValid,
    checkUserExists: checkUserExists,
    isAdminId: isAdminId
}