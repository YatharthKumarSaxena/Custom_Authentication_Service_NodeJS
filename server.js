require("dotenv").config();
require("module-alias/register");

// BOOT VALIDATION - Must run BEFORE anything else
require("@bootstrap/env.defaults").applyEnvDefaults();
require("@bootstrap/env.validator").validateEnvironment();

const mongoose = require("mongoose");
const db = mongoose.connection;

const { app } = require("@app"); // import pure Express app
const { DB_URL } = require("@configs/db.config");
const { PORT_NUMBER } = require("@configs/server.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/utils/error-handler.util");
const { bootstrapSuperAdmin } = require("@services/bootstrap/super-admin-bootstrap.service");

// Connect to MongoDB
mongoose.connect(DB_URL);

db.on("error", (err) => {
    logWithTime("⚠️ Error while connecting to Database");
    errorMessage(err);
});

db.once("open", async () => {
    logWithTime("✅ Connection established with MongoDB Successfully");

    // Bootstrap Super Admin - CRITICAL STEP
    try {
        const bootstrapSuccess = await bootstrapSuperAdmin();
        
        if (!bootstrapSuccess) {
            logWithTime("❌ Super Admin Bootstrap Failed - System cannot continue");
            logWithTime("⛔ Please check .env configuration and try again");
            process.exit(1); // ⛔ HARD STOP - Admin bootstrap is critical
        }
        
        logWithTime("✅ Super Admin Bootstrap Completed");
    } catch (err) {
        logWithTime("❌ Critical Error during Super Admin Bootstrap");
        errorMessage(err);
        process.exit(1); // HARD STOP on exception
    }

    // Initialize Microservice Components (if enabled)
    try {
        const { initializeMicroservice, setupTokenRotationScheduler } = require("@services/bootstrap/microservice-init.service");
        await initializeMicroservice();
        setupTokenRotationScheduler();
    } catch (err) {
        logWithTime("⚠️ Error during Microservice Initialization");
        errorMessage(err);
        // Don't stop server if microservice init fails in monolithic mode
    }

    // Start server after DB is ready
    app.listen(PORT_NUMBER, () => {
        logWithTime(`🚀 Server running on port ${PORT_NUMBER}`);

        // Enable cron jobs
        require("@cron-jobs");
        logWithTime("✅ Cron Jobs Initialized");
    });
});