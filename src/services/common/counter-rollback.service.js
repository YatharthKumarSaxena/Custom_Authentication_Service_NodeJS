const { CounterModel } = require("@models/counter.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { customIdPrefix } = require("@configs/id-prefixes.config");

/**
 * Rollback counter after failed user creation
 * Decrements the sequence to avoid gaps in userId
 * @returns {Promise<boolean>} Success status
 */

const rollbackAdminCounter = async () => {
  try {
    const counter = await CounterModel.findOneAndUpdate(
      { _id: customIdPrefix },
      { $inc: { seq: -1 } },
      { new: true }
    );

    if (!counter) {
      logWithTime("⚠️ Failed to rollback counter - counter not found");
      return false;
    }

    if (counter.seq < 0) {
      // Prevent negative sequence
      await CounterModel.findOneAndUpdate(
        { _id: customIdPrefix },
        { $set: { seq: 0 } }
      );
      logWithTime("⚠️ Counter was negative, reset to 0");
    }

    logWithTime(`✅ Counter rolled back to: ${counter.seq}`);
    return true;

  } catch (err) {
    logWithTime("❌ Error in rollbackAdminCounter");
    errorMessage(err);
    return false;
  }
};

module.exports = {
  rollbackAdminCounter
};