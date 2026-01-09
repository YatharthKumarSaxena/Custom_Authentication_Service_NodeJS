// utils/existence-factory.util.js
const { logWithTime } = require("@utils/time-stamps.util");
const { BAD_REQUEST } = require("@configs/http-status.config");
const { errorMessage, throwInternalServerError } = require("@utils/error-handler.util");

/**
 * Generic existence checker factory
 * @param {Object} Model - Mongoose model (UserModel/AdminModel)
 * @param {Object} identifiers - { emailKey, phoneKey }
 * @param {String} entityName - "User" or "Admin"
 */

const checkEntityExists = async (Model, identifiers, email, fullPhoneNumber, res, entityName) => {
  try {
    let reason = "";
    const [phoneEntity, emailEntity] = await Promise.all([
      Model.findOne({ [identifiers.phoneKey]: fullPhoneNumber }),
      Model.findOne({ [identifiers.emailKey]: email })
    ]);

    if (phoneEntity && emailEntity) {
      reason = `Phone Number: ${fullPhoneNumber} and Email ID: ${email}`;
    } else if (phoneEntity) {
      reason = `Phone Number: ${fullPhoneNumber}`;
    } else if (emailEntity) {
      reason = `Email ID: ${email}`;
    }

    if (reason) logWithTime(`⚠️ ${entityName} Already Exists with ${reason}`);
    return reason;
  } catch (err) {
    logWithTime(`❌ Internal Error while checking ${entityName} existence.`);
    errorMessage(err);
    throwInternalServerError(res);
    return "";
  }
};

const checkAndAbortIfEntityExists = async (Model, identifiers, email, fullPhoneNumber, res, entityName) => {
  const existReason = await checkEntityExists(Model, identifiers, email, fullPhoneNumber, res, entityName);
  if (existReason !== "") {
    logWithTime(`⛔ Conflict Detected: ${existReason}`);
    if (!res.headersSent) {
      res.status(BAD_REQUEST).json({
        success: false,
        message: `${entityName} Already Exists with ${existReason}`,
        warning: "Use different Email ID or Phone Number or both based on Message"
      });
    }
    return true;
  }
  return false;
};

module.exports = { checkEntityExists, checkAndAbortIfEntityExists };