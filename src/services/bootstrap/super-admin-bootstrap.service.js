const { UserModel } = require("@models/user.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");
const { adminID } = require("@configs/admin-id.config");
const { UserTypes, AuthModes, FirstNameFieldSetting } = require("@configs/enums.config");
const { hashPassword, createPhoneNumber } = require("@utils/auth.util");
const { logBootstrapEvent } = require("@/services/system/system-log.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { authMode, FIRST_NAME_SETTING, ADMIN, IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { sendNotification } = require("@/utils/notification-dispatcher.util");

async function bootstrapSuperAdmin() {
  try {

    // ---------------------------------------------------------
    // 1. CHECK EXISTENCE
    // ---------------------------------------------------------
    const existingAdmin = await UserModel.findOne({ userType: UserTypes.ADMIN }).lean();
    if (existingAdmin) {
      logWithTime("ℹ️  Admin Bootstrap Skipped: Super Admin User already exists in the system.");
      return null;
    }

    let missingCreds = false;
    let passwordHash = null;

    // ---------------------------------------------------------
    // 2. DYNAMIC VALIDATION: Check .env based on Configs
    // ---------------------------------------------------------
    if (!ADMIN.PASSWORD) {
      logWithTime("⚠️ Super Admin Password is not set in Security Configs. Skipping Super Admin Creation.");
      missingCreds = true;
    } else {
      passwordHash = await hashPassword(ADMIN.PASSWORD);
    }

    // ---------------------------------------------------------
    // 3. PREPARE PAYLOAD
    // ---------------------------------------------------------


    const newAdminPayload = {
      userId: adminID,
      password: passwordHash,
      userType: UserTypes.ADMIN,
      isActive: true
    };

    // ---------------------------------------------------------
    // 4. AUTH MODE STRICT ENFORCEMENT
    // ---------------------------------------------------------

    if (authMode === AuthModes.EMAIL) {

      if (!ADMIN.EMAIL) {
        logWithTime(
          "❌ AuthMode EMAIL requires ADMIN.EMAIL but it is missing in .env"
        );
        missingCreds = true;
      }

      if (ADMIN.PHONE_NUMBER || ADMIN.COUNTRY_CODE) {
        logWithTime(
          "⚠️ AuthMode EMAIL detected — Phone credentials provided in .env will be ignored"
        );
      }

      newAdminPayload.email = ADMIN.EMAIL;
      newAdminPayload.isEmailVerified = true;
    }

    else if (authMode === AuthModes.PHONE) {

      if (!ADMIN.PHONE_NUMBER || !ADMIN.COUNTRY_CODE) {
        logWithTime(
          "❌ AuthMode PHONE requires ADMIN.PHONE_NUMBER and ADMIN.COUNTRY_CODE but one or both are missing in .env"
        );
        missingCreds = true;
      }

      if (ADMIN.EMAIL) {
        logWithTime(
          "⚠️ AuthMode PHONE detected — Email credential provided in .env will be ignored"
        );
      }

      newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
      newAdminPayload.localNumber = ADMIN.PHONE_NUMBER;
      newAdminPayload.phone = createPhoneNumber(
        ADMIN.COUNTRY_CODE,
        ADMIN.PHONE_NUMBER
      );
      newAdminPayload.isPhoneVerified = true;
    }

    else if (authMode === AuthModes.BOTH) {
      if (!ADMIN.EMAIL || !ADMIN.PHONE_NUMBER || !ADMIN.COUNTRY_CODE) {
        logWithTime(
          "❌ AuthMode BOTH requires ADMIN.EMAIL, ADMIN.PHONE_NUMBER and ADMIN.COUNTRY_CODE but one or more are missing in .env"
        );
        missingCreds = true;
      }

      newAdminPayload.email = ADMIN.EMAIL;
      newAdminPayload.isEmailVerified = true;

      newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
      newAdminPayload.localNumber = ADMIN.PHONE_NUMBER;
      newAdminPayload.phone = createPhoneNumber(
        ADMIN.COUNTRY_CODE,
        ADMIN.PHONE_NUMBER
      );
      newAdminPayload.isPhoneVerified = true;
    } else {
      // EITHER MODE
      if (!ADMIN.EMAIL && !(ADMIN.PHONE_NUMBER && ADMIN.COUNTRY_CODE)) {
        missingCreds = true;
      }
      if (ADMIN.EMAIL && (ADMIN.PHONE_NUMBER || ADMIN.COUNTRY_CODE)) {
        logWithTime(
          "⚠️ AuthMode EITHER detected — Both Email and Phone credentials provided in .env. Please provide only one."
        );
        missingCreds = true;
      }
      if (ADMIN.EMAIL) {
        newAdminPayload.email = ADMIN.EMAIL;
        newAdminPayload.isEmailVerified = true;
      }
      if (ADMIN.PHONE_NUMBER && ADMIN.COUNTRY_CODE) {
        newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
        newAdminPayload.localNumber = ADMIN.PHONE_NUMBER;
        newAdminPayload.phone = createPhoneNumber(
          ADMIN.COUNTRY_CODE,
          ADMIN.PHONE_NUMBER
        );
        newAdminPayload.isPhoneVerified = true;
      }
    }


    if (missingCreds) {
      logWithTime(`⚠️ Admin Bootstrap Skipped: Missing Credentials for Auth Mode [${authMode}]`);
      return null;
    }

    // ✅ FIX: Use 'FIRST_NAME_SETTING' directly
    if (FIRST_NAME_SETTING === FirstNameFieldSetting.MANDATORY && !ADMIN.NAME) {
      logWithTime("⚠️ Admin Bootstrap Skipped: First Name is Mandatory but missing in .env");
      return null;
    }

    if (FIRST_NAME_SETTING === FirstNameFieldSetting.DISABLED && ADMIN.NAME) {
      logWithTime("⚠️ Admin Bootstrap Skipped: First Name field is Disabled but a name is provided in .env");
      return null;
    }

    logWithTime(`⚙️ Bootstrapping Super Admin... [Mode: ${authMode}]`);

    // 👉 Handle First Name
    if (FIRST_NAME_SETTING !== FirstNameFieldSetting.DISABLED && ADMIN.NAME) {
      newAdminPayload.firstName = ADMIN.NAME;
    }

    if (IS_TWO_FA_FEATURE_ENABLED) {
      newAdminPayload.twoFactorEnabled = true;
      newAdminPayload.twoFactorEnabledAt = new Date();
    }

    logWithTime(
      `🔐 Super Admin Security Policy → 2FA: ${IS_TWO_FA_FEATURE_ENABLED ? "ENABLED" : "DISABLED"}`
    );
    
    // ---------------------------------------------------------
    // 5. CREATE ADMIN
    // ---------------------------------------------------------

    const createdAdmin = await UserModel.create(newAdminPayload);

    logWithTime("👑 Super Admin User Created Successfully");

    // 6. System Log (fire-and-forget)
    logBootstrapEvent(
      "ADMIN_CREATED",
      `Super Admin created successfully via bootstrap (Auth Mode: ${authMode})`,
      createdAdmin.userId
    );

    // 7. Send Notification
    const contactInfo = getUserContacts(createdAdmin);
    sendNotification({
      contactInfo,
      emailTemplate: userTemplate.welcome_super_admin,
      smsTemplate: userSmsTemplate.welcome_super_admin,
      data: { name: createdAdmin.firstName || "Super Admin" }
    });

    return createdAdmin;

  } catch (err) {
    logWithTime("⚠️ Error Occurred while Bootstrapping Admin User");
    errorMessage(err);
    return null;
  }
}

module.exports = { bootstrapSuperAdmin };

