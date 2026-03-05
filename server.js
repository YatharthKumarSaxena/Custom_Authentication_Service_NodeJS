require("module-alias/register");


const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

// Load and expand environment variables
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// BOOT VALIDATION - Must run BEFORE anything else
require("@bootstrap/env.defaults").applyEnvDefaults();
require("@bootstrap/env.validator").validateEnvironment();

const mongoose = require("mongoose");

const { app } = require("@app");
const { DB_URL } = require("@configs/db.config");
const { PORT_NUMBER } = require("@configs/server.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { bootstrapSuperAdmin } = require("@services/bootstrap/super-admin-bootstrap.service");
const { logSystemConfiguration } = require("@services/bootstrap/system-info.service");

(async () => {
    try {
        // 📋 LOG SYSTEM CONFIGURATION
        // await logSystemConfiguration();

        // 🔑 DATABASE CONNECTION (CORRECT WAY)
        await mongoose.connect(DB_URL);
        logWithTime("✅ Connection established with MongoDB Successfully");

        // 🛡️ Bootstrap Super Admin
        const bootstrapSuccess = await bootstrapSuperAdmin();
        if (!bootstrapSuccess) {
            logWithTime("❌ Super Admin Bootstrap Failed");
            process.exit(1);
        }
        logWithTime("✅ Super Admin Bootstrap Completed");

        // 🔄 Microservice Init
        try {
            const {
                initializeMicroservice,
                setupTokenRotationScheduler
            } = require("@services/bootstrap/microservice-init.service");

            await initializeMicroservice();
            setupTokenRotationScheduler();
        } catch (err) {
            logWithTime("⚠️ Microservice init failed");
            errorMessage(err);
        }

        // 🚀 Start Server
        app.listen(PORT_NUMBER, () => {
            logWithTime(`🚀 Server running on port ${PORT_NUMBER}`);
            require("@cron-jobs");
            logWithTime("✅ Cron Jobs Initialized");
        });

    } catch (err) {
        logWithTime("❌ MongoDB Connection Failed");
        errorMessage(err);
        process.exit(1);
    }
})();