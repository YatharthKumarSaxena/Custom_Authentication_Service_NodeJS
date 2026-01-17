const { UserModel } = require("@models/user.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");
const { adminID } = require("@configs/admin-id.config");
const { UserTypes, AuthModes, FirstNameFieldSetting } = require("@configs/enums.config");
const { hashPassword, createPhoneNumber } = require("@utils/auth.util");
const { logBootstrapEvent } = require("@utils/system-log.util");

const { authMode, FIRST_NAME_SETTING, ADMIN, DEVICE } = require("@configs/security.config");

async function bootstrapSuperAdmin() {
  try {
    // ---------------------------------------------------------
    // 1. DYNAMIC VALIDATION: Check .env based on Configs
    // ---------------------------------------------------------
    
    let missingCreds = false;

    // ✅ FIX: Use 'ADMIN' directly, not 'config.ADMIN'
    if (authMode === AuthModes.EMAIL && !ADMIN.EMAIL) missingCreds = true;
    if (authMode === AuthModes.PHONE && (!ADMIN.PHONE_NUMBER || !ADMIN.COUNTRY_CODE)) missingCreds = true;
    if (authMode === AuthModes.BOTH && (!ADMIN.EMAIL || !ADMIN.PHONE_NUMBER)) missingCreds = true;

    if (missingCreds || !ADMIN.PASSWORD) {
        logWithTime(`⚠️ Admin Bootstrap Skipped: Missing Credentials for Auth Mode [${authMode}]`);
        return null;
    }

    // ✅ FIX: Use 'FIRST_NAME_SETTING' directly
    if (FIRST_NAME_SETTING === FirstNameFieldSetting.MANDATORY && !ADMIN.NAME) {
        logWithTime("⚠️ Admin Bootstrap Skipped: First Name is Mandatory but missing in .env");
        return null;
    }

    // ---------------------------------------------------------
    // 2. CHECK EXISTENCE
    // ---------------------------------------------------------
    const existingAdmin = await UserModel.findOne({ userType: UserTypes.ADMIN }).lean();
    if (existingAdmin) {
        logWithTime("ℹ️  Admin Bootstrap Skipped: Super Admin User already exists in the system.");
        return null;
    }

    logWithTime(`⚙️ Bootstrapping Super Admin... [Mode: ${authMode}]`);

    // ---------------------------------------------------------
    // 3. PREPARE PAYLOAD
    // ---------------------------------------------------------
    const passwordHash = await hashPassword(ADMIN.PASSWORD);
    
    const newAdminPayload = {
      userId: adminID,
      password: passwordHash,
      userType: UserTypes.ADMIN,
      isActive: true
    };

    // 👉 Handle First Name
    if (FIRST_NAME_SETTING !== FirstNameFieldSetting.DISABLED && ADMIN.NAME) {
        newAdminPayload.firstName = ADMIN.NAME;
    }

    // 👉 Handle Auth Identifiers
    if (ADMIN.EMAIL) {
        newAdminPayload.email = ADMIN.EMAIL;
        newAdminPayload.isEmailVerified = true;
    }

    if (ADMIN.PHONE_NUMBER && ADMIN.COUNTRY_CODE) {
        newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
        newAdminPayload.localNumber = ADMIN.PHONE_NUMBER;
        // Construct full phone
        newAdminPayload.phone = createPhoneNumber(ADMIN.COUNTRY_CODE, ADMIN.PHONE_NUMBER);
        newAdminPayload.isPhoneVerified = true;
    }

    // ---------------------------------------------------------
    // 4. CREATE ADMIN
    // ---------------------------------------------------------
    
    // Strict Schema Check
    if (authMode === AuthModes.EMAIL && !newAdminPayload.email) return null;
    if (authMode === AuthModes.PHONE && !newAdminPayload.phone) return null;
    if (authMode === AuthModes.BOTH && (!newAdminPayload.email || !newAdminPayload.phone)) return null;

    const createdAdmin = await UserModel.create(newAdminPayload);

    logWithTime("👑 Super Admin User Created Successfully");

    // ---------------------------------------------------------
    // 5. SYSTEM DEVICE & LOGGING
    // ---------------------------------------------------------
    
    // ✅ FIX: Use DEVICE config from .env (UUID v4)
    // This ensures your Activity Logs are linked to the configured system UUID
    const systemDevice = { 
        deviceUUID: DEVICE.DEVICE_UUID, 
        deviceName: DEVICE.DEVICE_NAME,
        deviceType: DEVICE.DEVICE_TYPE
    };
    
    // System Log (fire-and-forget)
    logBootstrapEvent(
        "ADMIN_CREATED",
        `Super Admin created successfully via bootstrap (Auth Mode: ${authMode})`,
        createdAdmin.userId
    );

    return createdAdmin;

  } catch (err) {
    logWithTime("⚠️ Error Occurred while Bootstrapping Admin User");
    errorMessage(err);
    return null;
  }
}

module.exports = { bootstrapSuperAdmin };