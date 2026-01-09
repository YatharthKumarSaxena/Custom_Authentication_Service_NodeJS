const { CounterModel } = require("@models/counter.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");
const { userIDPrefix } = require("@configs/system.config");

/**
 * Rollback admin counter after failed admin creation
 * Decrements the sequence to avoid gaps in adminId
 * @returns {Promise<boolean>} Success status
 */

const rollbackAdminCounter = async () => {
  try {
    const counter = await CounterModel.findOneAndUpdate(
      { _id: adminIDPrefix },
      { $inc: { seq: -1 } },
      { new: true }
    );

    if (!counter) {
      logWithTime("⚠️ Failed to rollback admin counter - counter not found");
      return false;
    }

    if (counter.seq < 0) {
      // Prevent negative sequence
      await CounterModel.findOneAndUpdate(
        { _id: adminIDPrefix },
        { $set: { seq: 0 } }
      );
      logWithTime("⚠️ Counter was negative, reset to 0");
    }

    logWithTime(`✅ Admin counter rolled back to: ${counter.seq}`);
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