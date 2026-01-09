// utils/fetch-factory.util.js
const { 
  errorMessage, 
  getLogIdentifiers 
} = require("@utils/error-handler.util");

const { logWithTime } = require("./time-stamps.util");

/**
 * Generic fetch factory for User/Admin
 * 
 * ⚠️ IMPORTANT: This util does NOT throw HTTP responses
 * It ONLY fetches entity from DB and returns result object
 * Caller (middleware/controller) is responsible for handling errors and sending responses
 * 
 * @param {Object} req - Express request (only for reading data)
 * @param {Object} Model - Mongoose model (UserModel/AdminModel)
 * @param {Object} identifiers - identifier mapping { idKey, emailKey, phoneKey }
 * @param {String} entityName - "User" or "Admin"
 * @returns {Promise<Object>} - { success: boolean, entity: Object|null, verifyWith: string, error: string|null }
 */
const fetchEntity = async (req, Model, identifiers, entityName) => {
  try {
    let entity = null;
    let verifyWith = "";
    let anyResourcePresent = true;

    // Check query params first, then body
    if (req?.query?.[identifiers.idKey]) {
      entity = await Model.findOne({ [identifiers.idKey]: req.query[identifiers.idKey].trim() });
      if (entity) verifyWith = "ID";
    } else if (req?.query?.[identifiers.emailKey]) {
      entity = await Model.findOne({ [identifiers.emailKey]: req.query[identifiers.emailKey].trim().toLowerCase() });
      if (entity) verifyWith = "EMAIL";
    } else if (req?.query?.[identifiers.phoneKey]) {
      entity = await Model.findOne({ [identifiers.phoneKey]: req.query[identifiers.phoneKey].trim() });
      if (entity) verifyWith = "PHONE";
    } else if (req?.body?.[identifiers.idKey]) {
      entity = await Model.findOne({ [identifiers.idKey]: req.body[identifiers.idKey].trim() });
      if (entity) verifyWith = "ID";
    } else if (req?.body?.[identifiers.emailKey]) {
      entity = await Model.findOne({ [identifiers.emailKey]: req.body[identifiers.emailKey].trim().toLowerCase() });
      if (entity) verifyWith = "EMAIL";
    } else if (req?.body?.[identifiers.phoneKey]) {
      entity = await Model.findOne({ [identifiers.phoneKey]: req.body[identifiers.phoneKey].trim() });
      if (entity) verifyWith = "PHONE";
    } else {
      anyResourcePresent = false;
    }

    // No identifier provided
    if (!anyResourcePresent) {
      logWithTime(`⚠️ No resource provided for ${entityName} fetch`);
      return { 
        success: false, 
        entity: null, 
        verifyWith: "", 
        error: "NO_IDENTIFIER" 
      };
    }

    // Identifier provided but entity not found
    if (!entity) {
      logWithTime(`❌ ${entityName} not found with provided identifier`);
      return { 
        success: false, 
        entity: null, 
        verifyWith, 
        error: "NOT_FOUND" 
      };
    }

    // Success - entity found
    logWithTime(`✅ ${entityName} identified using: ${verifyWith}`);
    return { 
      success: true, 
      entity, 
      verifyWith, 
      error: null 
    };

  } catch (err) {
    const getIdentifiers = getLogIdentifiers(req);
    logWithTime(`❌ Internal Error while fetching ${entityName} ${getIdentifiers}`);
    errorMessage(err);
    return { 
      success: false, 
      entity: null, 
      verifyWith: "", 
      error: "INTERNAL_ERROR" 
    };
  }
};

module.exports = { fetchEntity };