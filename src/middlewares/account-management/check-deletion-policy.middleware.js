/**
 * Check if specific deletion policies are allowed
 * Validates DELETION_POLICY config against allowed values
 */

const { factoryMiddlewares } = require("../factory/index");
const { DeletionPolicy } = require("@configs/enums.config");
const { DELETION_POLICY } = require("@configs/security.config");

const { checkEnumFeature } = factoryMiddlewares;

/**
 * Check if Soft Delete is allowed
 * Allows: SOFT_DELETE, HYBRID
 */
const checkSoftDeleteAllowed = checkEnumFeature(
    "Soft Delete",
    () => DELETION_POLICY,
    [DeletionPolicy.SOFT_DELETE, DeletionPolicy.HYBRID],
    "Soft delete is not enabled. Current deletion policy only allows hard delete."
);

/**
 * Check if Hard Delete is allowed
 * Allows: HARD_DELETE, HYBRID
 */
const checkHardDeleteAllowed = checkEnumFeature(
    "Hard Delete",
    () => DELETION_POLICY,
    [DeletionPolicy.HARD_DELETE, DeletionPolicy.HYBRID],
    "Hard delete is not enabled. Current deletion policy only allows soft delete."
);

module.exports = {
    checkSoftDeleteAllowed,
    checkHardDeleteAllowed
};