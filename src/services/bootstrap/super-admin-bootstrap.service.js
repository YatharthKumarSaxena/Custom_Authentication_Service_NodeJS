const { UserModel } = require("@models/user.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { adminID } = require("@configs/admin-id.config");
const { UserTypes, AuthModes, FirstNameFieldSetting } = require("@configs/enums.config");
const { hashPassword, createPhoneNumber } = require("@utils/auth.util");
const { logBootstrapEvent } = require("@/services/system/system-log.service");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { authMode, FIRST_NAME_SETTING, ADMIN, IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { sendNotification } = require("@/utils/notification-dispatcher.util");
const { 
  emailLength, 
  passwordLength, 
  countryCodeLength, 
  localNumberLength,
  firstNameLength 
} = require("@configs/fields-length.config");

const { 
  emailRegex, 
  localNumberRegex, 
  countryCodeRegex,
  firstNameRegex,
  strongPasswordRegex 
} = require("@configs/regex.config");
const { validateLength, isValidRegex } = require("@/utils/validators-factory.util");
const internals = require("@/internals");
const isMicroserviceMode = internals?.isMicroserviceMode?.() || false;

async function bootstrapSuperAdmin() {
  try {

    // 1. CHECK EXISTENCE
    const existingAdmin = await UserModel.findOne({ userType: UserTypes.ADMIN }).lean();
    if (existingAdmin) {
      logWithTime("ℹ️  Admin Bootstrap Skipped: Super Admin User already exists in the system.");
      return true; // Already exists = success
    }

    let missingCreds = false;
    let passwordHash = null;

    // 2. PASSWORD VALIDATION & HASHING
    if (!ADMIN.PASSWORD) {
      logWithTime("⚠️ Super Admin Password is not set in Security Configs.");
      missingCreds = true;
    } else {
      if (!isValidRegex(ADMIN.PASSWORD, strongPasswordRegex) || !validateLength(ADMIN.PASSWORD, passwordLength.min, passwordLength.max)) {
          logWithTime("❌ Super Admin Password does not meet strength or length requirements in Security Configs.");
          return false;
      }
      passwordHash = await hashPassword(ADMIN.PASSWORD);
    }

    // 3. PREPARE PAYLOAD
    const newAdminPayload = {
      userId: adminID,
      password: passwordHash,
      userType: UserTypes.ADMIN,
      isActive: true
    };

    // 4. AUTH MODE STRICT ENFORCEMENT & VALIDATION

    // --- EMAIL MODE ---
    if (authMode === AuthModes.EMAIL) {

      if (!ADMIN.EMAIL) {
        logWithTime("❌ AuthMode EMAIL requires ADMIN.EMAIL but it is missing in .env");
        missingCreds = true;
      } else {
        // VALIDATION: Email Regex & Length
        if (!isValidRegex(ADMIN.EMAIL, emailRegex) || !validateLength(ADMIN.EMAIL, emailLength.min, emailLength.max)) {
            logWithTime(`❌ Invalid Email Format/Length in .env: ${ADMIN.EMAIL}`);
            return false;
        }
      }

      if (ADMIN.LOCAL_NUMBER || ADMIN.COUNTRY_CODE) {
        logWithTime("⚠️ AuthMode EMAIL detected — Phone credentials provided in .env will be ignored");
      }

      newAdminPayload.email = ADMIN.EMAIL;
      newAdminPayload.isEmailVerified = true;
    }

    // --- PHONE MODE ---
    else if (authMode === AuthModes.PHONE) {

      if (!ADMIN.LOCAL_NUMBER || !ADMIN.COUNTRY_CODE) {
        logWithTime("❌ AuthMode PHONE requires ADMIN.LOCAL_NUMBER and ADMIN.COUNTRY_CODE");
        missingCreds = true;
      } else {
        // VALIDATION: Country Code
        if (!isValidRegex(ADMIN.COUNTRY_CODE, countryCodeRegex) || !validateLength(ADMIN.COUNTRY_CODE, countryCodeLength.min, countryCodeLength.max)) {
            logWithTime(`❌ Invalid Country Code format or length in .env (e.g. 91, 1).`);
            return false;
        }
        // VALIDATION: Local Number (Regex + Length)
        if (!isValidRegex(ADMIN.LOCAL_NUMBER, localNumberRegex) || !validateLength(ADMIN.LOCAL_NUMBER, localNumberLength.min, localNumberLength.max)) {
             logWithTime(`❌ Invalid Phone Number format. Must be numeric and ${localNumberLength.min}-${localNumberLength.max} digits.`);
             return false;
        }
      }

      if (ADMIN.EMAIL) {
        logWithTime("⚠️ AuthMode PHONE detected — Email credential provided in .env will be ignored");
      }

      newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
      newAdminPayload.localNumber = ADMIN.LOCAL_NUMBER;
      newAdminPayload.phone = createPhoneNumber(ADMIN.COUNTRY_CODE, ADMIN.LOCAL_NUMBER);
      newAdminPayload.isPhoneVerified = true;
    }

    // --- BOTH MODE ---
    else if (authMode === AuthModes.BOTH) {
      if (!ADMIN.EMAIL || !ADMIN.LOCAL_NUMBER || !ADMIN.COUNTRY_CODE) {
        logWithTime("❌ AuthMode BOTH requires ADMIN.EMAIL, PHONE and COUNTRY_CODE");
        missingCreds = true;
      } else {
         // VALIDATE ALL
         if (!isValidRegex(ADMIN.EMAIL, emailRegex) || !validateLength(ADMIN.EMAIL, emailLength.min, emailLength.max)) {
            logWithTime(`❌ Invalid Email Format/Length in .env`);
            return false;
         }
         if (!isValidRegex(ADMIN.COUNTRY_CODE, countryCodeRegex) || !validateLength(ADMIN.COUNTRY_CODE, countryCodeLength.min, countryCodeLength.max)) {
            logWithTime(`❌ Invalid Country Code format/length in .env.`);
            return false;
         }
         if (!isValidRegex(ADMIN.LOCAL_NUMBER, localNumberRegex) || !validateLength(ADMIN.LOCAL_NUMBER, localNumberLength.min, localNumberLength.max)) {
            logWithTime(`❌ Invalid Phone Number format/length in .env.`);
            return false;
         }
      }

      newAdminPayload.email = ADMIN.EMAIL;
      newAdminPayload.isEmailVerified = true;

      newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
      newAdminPayload.localNumber = ADMIN.LOCAL_NUMBER;
      newAdminPayload.phone = createPhoneNumber(ADMIN.COUNTRY_CODE, ADMIN.LOCAL_NUMBER);
      newAdminPayload.isPhoneVerified = true;
    } 
    
    // --- EITHER MODE ---
    else {
      if (!ADMIN.EMAIL && !(ADMIN.LOCAL_NUMBER && ADMIN.COUNTRY_CODE)) {
        logWithTime("❌ AuthMode EITHER requires at least EMAIL or PHONE credentials in .env");
        missingCreds = true;
      }
      if (ADMIN.EMAIL && (ADMIN.LOCAL_NUMBER || ADMIN.COUNTRY_CODE)) {
        logWithTime("⚠️ AuthMode EITHER detected — Both Email and Phone provided. Please provide only one.");
        return false;
      }

      // Case A: Email Provided
      if (ADMIN.EMAIL) {
        // Validate Email
        if (!isValidRegex(ADMIN.EMAIL, emailRegex) || !validateLength(ADMIN.EMAIL, emailLength.min, emailLength.max)) {
            logWithTime(`❌ Invalid Email Format/Length in .env`);
            return false;
        }
        newAdminPayload.email = ADMIN.EMAIL;
        newAdminPayload.isEmailVerified = true;
      }
      
      // Case B: Phone Provided
      if (ADMIN.LOCAL_NUMBER && ADMIN.COUNTRY_CODE) {
        // Validate Phone
        if (!isValidRegex(ADMIN.COUNTRY_CODE, countryCodeRegex) || !validateLength(ADMIN.COUNTRY_CODE, countryCodeLength.min, countryCodeLength.max)) {
            logWithTime(`❌ Invalid Country Code format/length in .env.`);
            return false;
        }
        if (!isValidRegex(ADMIN.LOCAL_NUMBER, localNumberRegex) || !validateLength(ADMIN.LOCAL_NUMBER, localNumberLength.min, localNumberLength.max)) {
            logWithTime(`❌ Invalid Local Number format/length in .env`);
            return false;
        }
        newAdminPayload.countryCode = ADMIN.COUNTRY_CODE;
        newAdminPayload.localNumber = ADMIN.LOCAL_NUMBER;
        newAdminPayload.phone = createPhoneNumber(ADMIN.COUNTRY_CODE, ADMIN.LOCAL_NUMBER);
        newAdminPayload.isPhoneVerified = true;
      }
    }

    if (missingCreds) {
      logWithTime(`⚠️ Admin Bootstrap Skipped: Missing Credentials for Auth Mode [${authMode}]`);
      return false;
    }

    // 5. NAME VALIDATION
    // Check if Name is Mandatory
    if (FIRST_NAME_SETTING === FirstNameFieldSetting.MANDATORY && !ADMIN.NAME) {
      logWithTime("⚠️ Admin Bootstrap Skipped: First Name is Mandatory but missing in .env");
      return false;
    }

    // Check if Name is Disabled but provided
    if (FIRST_NAME_SETTING === FirstNameFieldSetting.DISABLED && ADMIN.NAME) {
      logWithTime("⚠️ Admin Bootstrap Skipped: First Name field is Disabled but a name is provided in .env");
      return false;
    }

    // VALIDATION: If Name exists (Mandatory or Optional), Validate it
    if (FIRST_NAME_SETTING !== FirstNameFieldSetting.DISABLED && ADMIN.NAME) {
        if (!isValidRegex(ADMIN.NAME, firstNameRegex) || !validateLength(ADMIN.NAME, firstNameLength.min, firstNameLength.max)) {
            logWithTime(`❌ Invalid First Name format/length in .env. Must be alphabetic.`);
            return false;
        }
        newAdminPayload.firstName = ADMIN.NAME;
    }

    logWithTime(`⚙️ Bootstrapping Super Admin... [Mode: ${authMode}]`);

    // 6. TWO FACTOR & CREATE
    if (IS_TWO_FA_FEATURE_ENABLED) {
      newAdminPayload.twoFactorEnabled = true;
      newAdminPayload.twoFactorEnabledAt = new Date();
    }

    logWithTime(
      `🔐 Super Admin Security Policy → 2FA: ${IS_TWO_FA_FEATURE_ENABLED ? "ENABLED" : "DISABLED"}`
    );
    
    const createdAdmin = await UserModel.create(newAdminPayload);

    logWithTime("👑 Super Admin User Created Successfully");

    // 7. Microservice: Create Super Admin in Admin Panel Service
    try {
      
      if (isMicroserviceMode) {
        logWithTime("🔗 Microservice Mode: Syncing super admin to Admin Panel Service...");
        
        const internal = require('@internals');
        if (internal && internal.clients && internal.clients.adminPanelClient) {
          const { createSuperAdmin } = internal.clients.adminPanelClient;
          
          // Prepare admin data for internal API
          const adminData = {
            userId: createdAdmin.userId,
          };
          
          // Add optional fields if they exist
          if (createdAdmin.email) adminData.email = createdAdmin.email;
          if (createdAdmin.phone) adminData.phone = createdAdmin.phone;
          if (createdAdmin.firstName) adminData.firstName = createdAdmin.firstName;
          
          const syncResult = await createSuperAdmin(adminData);
          
          if (syncResult.success) {
            logWithTime("✅ Super admin successfully synced to Admin Panel Service");
          } else {
            logWithTime("⚠️  Super admin created locally but failed to sync to Admin Panel Service");
            logWithTime(`   Reason: ${syncResult.error || 'Unknown error'}`);
            logWithTime("   Note: Local admin is still active, but Admin Panel may need manual sync");
          }
        }
      }
    } catch (syncError) {
      // Non-critical error - admin is created locally, sync can be retried later
      logWithTime("⚠️  Failed to sync super admin to Admin Panel Service");
      logWithTime(`   Error: ${syncError.message}`);
      logWithTime("   Note: Super admin is active locally, but Admin Panel Service sync failed");
    }

    // 8. System Log & Notification
    logBootstrapEvent(
      "ADMIN_CREATED",
      `Super Admin created successfully via bootstrap (Auth Mode: ${authMode})`,
      createdAdmin.userId
    );

    const contactInfo = getUserContacts(createdAdmin);
    sendNotification({
      contactInfo,
      emailTemplate: userTemplate.welcome_super_admin,
      smsTemplate: userSmsTemplate.welcome_super_admin,
      data: { name: createdAdmin.firstName || "Super Admin" }
    });

    return true; // Admin created successfully

  } catch (err) {
    logWithTime("⚠️ Error Occurred while Bootstrapping Admin User");
    errorMessage(err);
    return false; // Error occurred
  }
}

module.exports = { bootstrapSuperAdmin };