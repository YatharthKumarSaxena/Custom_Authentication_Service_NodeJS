const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("./error-handler.util");

/**
 * 🏭 Factory function to fetch any entity (Admin/User) from database
 * 
 * ⚠️ IMPORTANT: This util does NOT validate auth mode or required fields
 * Validation is middleware's responsibility - this util ONLY does database query
 * 
 * @param {Object} Model - Mongoose model (AdminModel or UserModel)
 * @param {string|null} email - Entity's email address
 * @param {string|null} phone - Entity's full phone number
 * @param {string|null} userId - Entity's custom userId
 * @param {string} entityType - Type of entity ("Admin" or "User") for logging
 * @param {string} userIdField - Field name for userId in model (e.g., "adminId" or "userId")
 * @returns {Promise<Object|null>} - Returns the entity object if found, null otherwise
 */

const fetchEntity = async (
  Model, 
  email = null, 
  phone = null, 
  userId = null, 
  entityType = "Entity",
  userIdField = "userId"
) => {
  try {
    // Priority 1: userId (direct fetch)
    if (userId) {
      const query = { [userIdField]: userId };
      const entity = await Model.findOne(query);
      
      if (entity) {
        logWithTime(`✅ ${entityType} found by userId: ${entity[userIdField]}`);
      } else {
        logWithTime(`❌ ${entityType} not found with userId: ${userId}`);
      }
      return entity;
    }

    // Priority 2: Email/Phone based fetch
    // Build conditions array based on what's provided (NO validation here)
    let conditions = [];

    if (email) {
      conditions.push({ email });
    }
    
    if (phone) {
      conditions.push({ phone });
    }

    // Agar koi condition nahi, return null
    if (conditions.length === 0) {
      logWithTime(`❌ No identifiers provided for ${entityType} fetch`);
      return null;
    }

    // Query with $or to match any provided identifier
    const query = conditions.length === 1 ? conditions[0] : { $or: conditions };
    const entity = await Model.findOne(query);

    if (entity) {
      logWithTime(`✅ ${entityType} found: ${entity[userIdField] || entity.email || entity.phone}`);
    } else {
      logWithTime(`❌ ${entityType} not found with query: ${JSON.stringify(query)}`);
    }
    
    return entity;
    
  } catch (err) {
    logWithTime(`❌ Error occurred while fetching ${entityType}`);
    errorMessage(err);
    return null;
  }
};

module.exports = {
  fetchEntity
};