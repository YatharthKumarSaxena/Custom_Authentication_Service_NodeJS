const { AuditMode } = require("@configs/enums.config");

/**
 * 📸 Audit Data Utility
 * Simple approach - pass full objects, get filtered data based on ENV
 */

/**
 * Prepare audit data for activity tracker
 * @param {Object} oldEntity - Entity before changes
 * @param {Object} newEntity - Entity after changes
 * @returns {Object} { oldData, newData, changedFields }
 */
const prepareAuditData = (oldEntity, newEntity) => {
  if (!oldEntity && !newEntity) {
    return { oldData: null, newData: null };
  }

  // Convert Mongoose docs to plain objects
  const oldObj = oldEntity.toObject ? oldEntity.toObject() : { ...oldEntity };
  const newObj = newEntity.toObject ? newEntity.toObject() : { ...newEntity };

  // Remove Mongoose internal fields
  delete oldObj.__v;
  delete oldObj._id;
  delete newObj.__v;
  delete newObj._id;

  const auditMode = process.env.AUDIT_MODE;

  // Return based on mode
  if (auditMode === AuditMode.FULL) {
    return {
      oldData: oldObj,
      newData: newObj
    };
  }

  // Find changed fields
  const changedFields = [];
  for (const key in newObj) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changedFields.push(key);
    }
  }

  // CHANGED_ONLY mode - filter to only changed fields
  const oldDataFiltered = {};
  const newDataFiltered = {};

  changedFields.forEach(field => {
    oldDataFiltered[field] = oldObj[field];
    newDataFiltered[field] = newObj[field];
  });

  return {
    oldData: oldDataFiltered,
    newData: newDataFiltered
  };
};

/**
 * Clone entity for audit (before making changes)
 */
const cloneForAudit = (entity) => {
  if (!entity) return null;
  const obj = entity.toObject ? entity.toObject() : entity;
  return JSON.parse(JSON.stringify(obj));
};

module.exports = {
  prepareAuditData,
  cloneForAudit
};