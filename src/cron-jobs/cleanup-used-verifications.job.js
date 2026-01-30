const cron = require("node-cron");
const { VerificationLinkModel, OTPModel } = require("@models/index");
const { logWithTime } = require("@utils/time-stamps.util");
const { verificationCleanup } = require("@configs/cron.config");
const { errorMessage } = require("@utils/error-handler.util");
const { logCronExecution, logCronFailure } = require("@/services/system/system-log.service");

const cleanUsedVerifications = async () => {
  try {
    if (!verificationCleanup.enable) return;

    logWithTime("📅 [CRON-JOB] ➤ Used Verifications Cleanup Started...");

    // Delete expired or used OTPs
    const otpResult = await OTPModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true }
      ]
    });

    // Delete expired or used Links
    const linkResult = await VerificationLinkModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true }
      ]
    });

    const totalDeleted = otpResult.deletedCount + linkResult.deletedCount;

    await logAuthEvent({
      user: { userID: "SYSTEM_BATCH_CRON", userType: "SYSTEM" },
      deviceID: process.env.DEVICE_UUID,
      deviceName: process.env.DEVICE_NAME,
      deviceType: process.env.DEVICE_TYPE
    }, "CLEAN_UP_VERIFICATIONS", {
      reason: `Deleted ${otpResult.deletedCount} OTPs and ${linkResult.deletedCount} Links (expired/used)`
    });

    if (totalDeleted === 0) {
      logWithTime(`📭 No expired or used verifications found.`);
    } else {
      logWithTime(`🗑️ Verification Cleanup Job: ${otpResult.deletedCount} OTPs + ${linkResult.deletedCount} Links deleted.`);
    }
    
    // System Log (fire-and-forget)
    logCronExecution(
      "CLEANUP_VERIFICATIONS",
      { deletedOTPs: otpResult.deletedCount, deletedLinks: linkResult.deletedCount, totalDeleted },
      `Deleted ${otpResult.deletedCount} OTPs and ${linkResult.deletedCount} Links (expired/used)`
    );
  } catch (err) {
    logWithTime("❌ Internal Error in cleaning used verifications.");
    errorMessage(err);
    logCronFailure("CLEANUP_VERIFICATIONS", err);
  }
};

// ⏰ Run on schedule
cron.schedule(verificationCleanup.cronSchedule, cleanUsedVerifications, {
  timezone: verificationCleanup.timezone
});
