const cron = require("node-cron");
const { DeviceModel } = require("@models/device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { deviceCleanup } = require("@configs/cron.config");
const { errorMessage } = require("@utils/error-handler.util");
const { logCronExecution, logCronFailure } = require("@/services/system/system-log.util");

const cleanInactiveDevices = async () => {
  try {
    if (!deviceCleanup.enable) return;

    if (!deviceCleanup.inactiveDays || deviceCleanup.inactiveDays < 1) {
      logWithTime("⚠️ Invalid inactive days configuration. Skipping device cleanup.");
      return;
    }

    const cutoffDate = new Date(Date.now() - deviceCleanup.inactiveDays * 24 * 60 * 60 * 1000);

    logWithTime("📅 [CRON-JOB] ➤ Inactive Devices Cleanup Started...");

    // Find devices that haven't been used in a long time and have no active sessions
    const result = await DeviceModel.deleteMany({
      lastUsedAt: { $lt: cutoffDate },
      isActive: false
    });

    if (result.deletedCount === 0) {
      logWithTime(`📭 No inactive devices found (older than ${deviceCleanup.inactiveDays} days).`);
    } else {
      logWithTime(`🗑️ Device Cleanup Job: ${result.deletedCount} inactive devices deleted (> ${deviceCleanup.inactiveDays} days).`);
    }
    
    // System Log (fire-and-forget)
    logCronExecution(
      "CLEANUP_INACTIVE_DEVICES",
      { deletedCount: result.deletedCount, inactiveDays: deviceCleanup.inactiveDays },
      `Deleted ${result.deletedCount} inactive devices (> ${deviceCleanup.inactiveDays} days)`
    );
  } catch (err) {
    logWithTime("❌ Internal Error in cleaning inactive devices.");
    errorMessage(err);
    logCronFailure("CLEANUP_INACTIVE_DEVICES", err);
  }
};

// ⏰ Run on schedule
cron.schedule(deviceCleanup.cronSchedule, cleanInactiveDevices, {
  timezone: deviceCleanup.timezone
});
