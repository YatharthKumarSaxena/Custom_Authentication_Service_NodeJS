const { UserModel } = require("@models/user.model"); // Mongoose User model
const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("./error-handler.configs");
const authLogEvents = require("./auth-log-events.config");
const { adminAuthLogForSetUp } = require("./auth-log-util");
const { adminID } = require("@cconfigs/admin-id.config"); // Ensure this config exists
const { UserTypes } = require("@/configs/enums.config");
const { hashPassword } = require("./auth.util");

async function bootstrapSuperAdmin() {
  try {
    // Check if any admin already exists
    const existingAdmin = await UserModel.findOne({ userType: UserTypes.ADMIN }).exec();
    if (existingAdmin) {
      logWithTime("🟢 Admin User already exists.");
      return null;
    }

    // Prepare new admin data
    const newAdmin = {
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_FULL_PHONE_NUMBER,
      password: await hashPassword(process.env.ADMIN_PASSWORD),
      email: process.env.ADMIN_EMAIL_ID,
      userType: UserTypes.ADMIN,
      userId: adminID,
      isEmailVerified: true,
      isPhoneVerified: true,
    };

    // Create admin in MongoDB
    const createdAdmin = await UserModel.create(newAdmin);

    logWithTime("👑 Admin User Created Successfully");
    logWithTime("Admin User details are given below:-");
    console.log(createdAdmin);

    // Create auth log
    await adminAuthLogForSetUp(createdAdmin, authLogEvents.REGISTER, null);

    return createdAdmin;
  } catch (err) {
    logWithTime("⚠️ Error Occurred while Bootstrapping Admin User");
    errorMessage(err);
    return null;
  }
}

module.exports = {
  bootstrapSuperAdmin
};
