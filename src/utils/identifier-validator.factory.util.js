// utils/identifier-validator.factory.js
const { logWithTime } = require("./time-stamps.util");
const { IdentifierKeys } = require("@configs/enums.config");
const { throwBadRequestError } = require("./error-handler.util");

/**
 * Factory to generate a validator for a single identifier for User/Admin
 * @param {String} role - "User" or "Admin"
 * @param {String} source - "body" or "query"
 * @returns {Function} Middleware validator function (req, res)
 */

const createSingleIdentifierValidator = (role = "Admin", source = "body") => {
  return (req, res) => {
    const mode = process.env.AUTH_MODE;
    const identifiers = IdentifierKeys[mode][role];

    const data = source === "query" ? { ...req.query } : { ...req.body };

    const validIdentifiers = identifiers.filter(
      key => data.hasOwnProperty(key) && typeof data[key] === "string" && data[key].trim() !== ""
    );

    if (validIdentifiers.length !== 1) {
      logWithTime(`🧷 Invalid input: More than one or no identifier provided for ${role} from device id: (${req.deviceId}).`);
      throwBadRequestError(res, `Please provide exactly one valid identifier for ${role}.`);
      return false;
    }

    const selectedKey = validIdentifiers[0];
    identifiers.forEach(key => {
      if (key !== selectedKey && key in data) {
        delete data[key];
      }
    });

    logWithTime(`🧩 Valid identifier input detected for ${role} from device id: (${req.deviceId}).`);
    return true;
  };
};

module.exports = { createSingleIdentifierValidator };