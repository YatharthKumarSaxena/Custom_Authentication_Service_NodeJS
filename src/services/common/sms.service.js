const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec); // Promise version for clean chaining
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * SMS Service - Fire and Forget
 * Accepts raw message string only.
 */

const sendSMS = async (to, message) => {
    // 1. Validation
    if (!to || !message) {
      logWithTime("⚠️ SMS skipped: Missing phone or message");
      return;
    }

    const smsMode = process.env.SMS_MODE || "mock"; 
    const isTermux = process.env.PREFIX?.includes("com.termux");

    // MOCK MODE (Instant Log)
    if (smsMode === "mock") {
      console.log(`\n📲 [MOCK SMS] To: ${to} | Msg: "${message}"`);
      return; // Return immediately
    }

    // SSH MODE (Background Execution)
    if (smsMode === "termux-ssh") {
        const termuxIP = process.env.TERMUX_IP;
        const termuxPort = process.env.TERMUX_PORT || "8022";
        const termuxUser = process.env.TERMUX_USER;
        const sshKeyPath = require("os").homedir() + "/.ssh/termux_key";

        if (!termuxIP || !termuxUser) {
            logWithTime("⚠️ SSH Config Missing. Falling back to Mock.");
            console.log(`📲 [FALLBACK MOCK] To: ${to} | Msg: "${message}"`);
            return;
        }

        const sanitizedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, " ");
        const sshCommand = `ssh -i ${sshKeyPath} -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${termuxPort} ${termuxUser}@${termuxIP} "termux-sms-send -n '${to}' '${sanitizedMessage}'"`;

        // FIRE AND FORGET: No 'await' here!
        execPromise(sshCommand)
            .then(({ stdout }) => {
                logWithTime(`✅ [Background] SMS sent via SSH to ${to}`);
            })
            .catch((error) => {
                logWithTime(`❌ [Background] SSH SMS Failed: ${error.message}`);
            });

        return; // Return control to main thread immediately
    }

    // DIRECT TERMUX MODE (Background Execution)
    if (smsMode === "real" && isTermux) {
        const sanitizedMessage = message.replace(/"/g, '\\"').replace(/\n/g, " ");
        const command = `termux-sms-send -n "${to}" "${sanitizedMessage}"`;

        // FIRE AND FORGET
        execPromise(command)
            .then(() => {
                logWithTime(`✅ [Background] SMS sent via Termux to ${to}`);
            })
            .catch((error) => {
                logWithTime(`❌ [Background] Termux SMS Failed: ${error.message}`);
            });
            
        return;
    }

    // Fallback
    logWithTime("⚠️ Invalid SMS Mode. Logged to console.");
    console.log(`📲 [FALLBACK] To: ${to} | Msg: "${message}"`);
};

module.exports = { sendSMS };