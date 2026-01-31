const { AuditMode } = require("@configs/enums.config");
const { auditMode } = require("@configs/security.config")

/**
 * Audit Data Utility
 * Simple approach - pass full objects, get filtered data based on ENV
 */

/**
 * Prepare audit data for activity tracker
 * @param {Object} oldEntity - Entity before changes
 * @param {Object} newEntity - Entity after changes
 * @returns {Object} { oldData, newData, changedFields }
 */

const toPlainObject = (entity) => {
  if (!entity) return null;
  return entity.toObject ? entity.toObject() : { ...entity };
};

const prepareAuditData = (oldEntity, newEntity) => {

  const oldObj = toPlainObject(oldEntity);
  const newObj = toPlainObject(newEntity);

  if (!oldObj && !newObj) {
    return { oldData: null, newData: null };
  }

  if (oldObj) {
    delete oldObj.__v;
    delete oldObj._id;
  }

  if (newObj) {
    delete newObj.__v;
    delete newObj._id;
  }

  if (auditMode === AuditMode.FULL) {
    return {
      oldData: oldObj,
      newData: newObj
    };
  }

  const changedFields = [];

  for (const key in newObj || {}) {
    if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj[key])) {
      changedFields.push(key);
    }
  }

  const oldDataFiltered = {};
  const newDataFiltered = {};

  changedFields.forEach(field => {
    oldDataFiltered[field] = oldObj?.[field];
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