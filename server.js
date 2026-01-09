require("module-alias/register");
const mongoose = require("mongoose");
const db = mongoose.connection;

const { app } = require("@app"); // import pure Express app
const { DB_URL } = require("@configs/db.config");
const { PORT_NUMBER } = require("@configs/server.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/utils/error-handler.util");

// Connect to MongoDB
mongoose.connect(DB_URL);

db.on("error", (err) => {
    logWithTime("⚠️ Error while connecting to Database");
    errorMessage(err);
});

db.once("open", () => {
    logWithTime("✅ Connection established with MongoDB Successfully");

    // Start server after DB is ready
    app.listen(PORT_NUMBER, () => {
        logWithTime(`🚀 Server running on port ${PORT_NUMBER}`);

        // Optional: cron jobs
        // require("./cron-jobs");
    });
});