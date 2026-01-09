const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * 📱 SMS Service - Termux Integration
 * Supports MOCK mode, REAL mode (direct Termux), and SSH mode (laptop to mobile)
 */

/**
 * Send SMS via Termux (direct or SSH) or Mock
 * @param {string} to - Phone number with country code (+91...)
 * @param {Object} config - SMS configuration with message
 * @returns {Promise<Object>} Send result
 */
const sendSMS = async (to, config) => {
  try {
    const message = config.message || config;

    // Validate inputs
    if (!to || !message) {
      logWithTime("⚠️ SMS not sent - phone number or message is empty");
      return { success: false, reason: "Missing phone or message" };
    }

    const smsMode = process.env.SMS_MODE || "mock"; // "mock", "real", or "termux-ssh"
    const isTermux = process.env.PREFIX?.includes("com.termux");

    // 🎭 MOCK MODE: Console logging only
    if (smsMode === "mock") {
      console.log("\n" + "━".repeat(70));
      console.log("📱 SMS NOTIFICATION (MOCK MODE)");
      console.log("━".repeat(70));
      console.log(`📞 To: ${to}`);
      console.log(`💬 Message:\n${message}`);
      console.log(`⏰ Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
      console.log(`🔧 Mode: Development (Mock)`);
      console.log("━".repeat(70) + "\n");

      return {
        success: true,
        mock: true,
        messageId: "MOCK_" + Date.now(),
        to,
        message,
        timestamp: new Date()
      };
    }

    // 🌉 SSH BRIDGE MODE: Laptop → Mobile via SSH
    if (smsMode === "termux-ssh") {
      const termuxIP = process.env.TERMUX_IP;
      const termuxPort = process.env.TERMUX_PORT || "8022";
      const termuxUser = process.env.TERMUX_USER;
      const sshKeyPath = require("os").homedir() + "/.ssh/termux_key";

      if (!termuxIP || !termuxUser) {
        logWithTime("⚠️ SSH mode enabled but TERMUX_IP or TERMUX_USER not configured");
        console.log("\n💡 Configure in .env:");
        console.log("TERMUX_IP=192.168.1.100");
        console.log("TERMUX_USER=u0_a123");
        console.log("\nFalling back to MOCK mode...\n");
        
        // Fallback to mock
        return sendSMS(to, { message });
      }

      const sanitizedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, " ");
      const sshCommand = `ssh -i ${sshKeyPath} -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${termuxPort} ${termuxUser}@${termuxIP} "termux-sms-send -n '${to}' '${sanitizedMessage}'"`;

      logWithTime(`📡 Sending SMS via SSH to Termux (${termuxIP})...`);

      const { stdout, stderr } = await execPromise(sshCommand, { timeout: 15000 });

      if (stderr && !stderr.includes("successfully")) {
        logWithTime(`⚠️ SSH SMS Warning: ${stderr}`);
      }

      logWithTime(`✅ SMS sent via Termux SSH to ${to}`);

      return {
        success: true,
        mock: false,
        real: true,
        mode: "ssh",
        to,
        message,
        timestamp: new Date(),
        stdout: stdout?.trim()
      };
    }

    // 🚀 REAL MODE: Direct Termux (only if running in Termux)
    if (smsMode === "real" && isTermux) {
      const sanitizedMessage = message.replace(/"/g, '\\"').replace(/\n/g, " ");
      const command = `termux-sms-send -n "${to}" "${sanitizedMessage}"`;

      const { stdout, stderr } = await execPromise(command, {
        timeout: 10000 // 10 second timeout
      });

      if (stderr && !stderr.includes("successfully")) {
        logWithTime(`⚠️ Termux SMS Warning: ${stderr}`);
      }

      logWithTime(`✅ SMS sent via Termux to ${to}`);

      return {
        success: true,
        mock: false,
        real: true,
        mode: "direct",
        to,
        message,
        timestamp: new Date(),
        stdout: stdout?.trim()
      };
    }

    // Invalid configuration - fallback to mock
    logWithTime("⚠️ Invalid SMS configuration, falling back to MOCK mode");
    return sendSMS(to, { message });

  } catch (error) {
    logWithTime(`❌ SMS Service Error: ${error.message}`);

    // Graceful fallback to mock on error
    console.log("\n📱 [SMS FALLBACK] Displaying in console due to error:");
    console.log(`To: ${to}`);
    console.log(`Message: ${typeof config === 'string' ? config : config.message}`);
    console.log(`Error: ${error.message}\n`);

    return {
      success: false,
      error: error.message,
      fallback: true,
      to
    };
  }
};

module.exports = { sendSMS };