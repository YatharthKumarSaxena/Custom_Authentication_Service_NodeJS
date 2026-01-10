const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const { SALT } = require("@configs/security.config");
const { UserModel } = require("@models/user.model"); // Mongoose User model
const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("./error-handler.configs");
const authLogEvents = require("./auth-log-events.config");
const { adminAuthLogForSetUp } = require("./auth-log-util");
const { adminID } = require("./admin-id.config");

async function bootstrapSuperAdmin() {
  try {
    // Check if any admin already exists
    const existingAdmin = await UserModel.findOne({ userType: "ADMIN" }).exec();
    if (existingAdmin) {
      logWithTime("🟢 Admin User already exists.");
      return null;
    }

    // Prepare new admin data
    const newAdmin = {
      name: process.env.ADMIN_NAME,
      fullPhoneNumber: process.env.ADMIN_FULL_PHONE_NUMBER,
      password: await bcryptjs.hash(process.env.ADMIN_PASSWORD, SALT),
      email: process.env.ADMIN_EMAIL_ID,
      userType: "ADMIN",
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
