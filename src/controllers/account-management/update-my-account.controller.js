// controllers/internal-api.controllers.js

const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwInvalidResourceError, getLogIdentifiers } = require("@utils/error-handler.util");
const { emailRegex, countryCodeRegex, localNumberRegex } = require("@configs/regex.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");
const { validateLength, isValidRegex } = require("@utils/field-validators.util");
const { createPhoneNumber, checkAndAbortIfUserExists } = require("@utils/auth.util");
const { emailLength, countryCodeLength, localNumberLength } = require("@configs/fields-length.config");

const updateMyAccount = async (req, res) => {
  try {
    const user = req.user;
    const updatedFields = [];

    // ------------------ Email Update ------------------
    if (req.body.emailID && req.body.emailID.trim().toLowerCase() !== user.emailID?.trim().toLowerCase()) {
      const emailID = req.body.emailID.trim().toLowerCase();

      if (!validateLength(emailID, emailLength.min, emailLength.max)) {
        return throwInvalidResourceError(res, `Email ID must be between ${emailLength.min}-${emailLength.max} characters.`);
      }
      if (!isValidRegex(emailID, emailRegex)) {
        return throwInvalidResourceError(res, "Invalid Email format.");
      }

      const exists = await checkAndAbortIfUserExists(emailID, user.phone, res);
      if (exists) return;

      user.emailID = emailID;
      updatedFields.push("Email ID");
    }

    // ------------------ Phone Update ------------------
    const phonePayload = req.body.localNumber;
    if (phonePayload && (phonePayload.number !== user.phoneNumber?.number || phonePayload.countryCode !== user.phoneNumber?.countryCode)) {
      let { countryCode, number } = phonePayload;

      // Country Code Validation
      if (countryCode && countryCode.trim() !== user.phoneNumber?.countryCode) {
        countryCode = countryCode.trim();
        if (!validateLength(countryCode, countryCodeLength.min, countryCodeLength.max)) {
          return throwInvalidResourceError(res, `Country Code must be ${countryCodeLength.min}-${countryCodeLength.max} digits.`);
        }
        if (!isValidRegex(countryCode, countryCodeRegex)) {
          return throwInvalidResourceError(res, "Invalid Country Code format.");
        }
        user.phoneNumber = { ...user.phoneNumber, countryCode };
        updatedFields.push("Country Code");
      }

      // Local Number Validation
      if (number && number.trim() !== user.phoneNumber?.number) {
        number = number.trim();
        if (!validateLength(number, localNumberLength.min, localNumberLength.max)) {
          return throwInvalidResourceError(res, `Phone Number must be ${localNumberLength.min}-${localNumberLength.max} digits.`);
        }
        if (!isValidRegex(number, localNumberRegex)) {
          return throwInvalidResourceError(res, "Invalid Phone Number format.");
        }
        user.phoneNumber = { ...user.phoneNumber, number };
        updatedFields.push("Phone Number");
      }

      // Create unified phone
      if (number || countryCode) {
        const newPhone = createPhoneNumber(req, res);
        if (!newPhone) return;

        const exists = await checkAndAbortIfUserExists(user.emailID, newPhone, res);
        if (exists) return;

        user.phone = newPhone;
      }
    }

    // ------------------ No Changes ------------------
    if (updatedFields.length === 0) {
      logWithTime(`❌ No changes detected for User ID: (${user.userID}) from device: (${req.deviceID})`);
      return res.status(OK).json({ message: "No changes detected. Your profile remains the same." });
    }

    await user.save();

    // ------------------ Logging ------------------
    logAuthEvent(req, "UPDATE_ACCOUNT_DETAILS", null);
    logWithTime(`✅ User (${user.userID}) updated fields: [${updatedFields.join(", ")}] from device: (${req.deviceID})`);

    return res.status(OK).json({
      success: true,
      message: "Profile updated successfully.",
      updatedFields
    });
  } catch (err) {
    const identifiers = getLogIdentifiers(req);
    logWithTime(`❌ Internal Error while updating User Profile ${identifiers}`);
    console.error(err);
    return throwInternalServerError(res);
  }
};

module.exports = {
  updateMyAccount
};
