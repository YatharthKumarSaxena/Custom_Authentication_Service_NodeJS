const { logWithTime } = require("@utils/time-stamps.util");
const { defaultConfig, masterEmailTemplate } = require("@configs/email.config");

/**
 * 🎨 Helper: Get color based on status
 */
const getStatusColor = (status) => {
    const { ui } = defaultConfig;
    
    // Check success categories
    if (ui.status_categories.success.includes(status)) {
        return ui.colors.success;
    }
    // Check warning categories
    if (ui.status_categories.warning.includes(status)) {
        return ui.colors.warning;
    }
    // Check danger categories
    if (ui.status_categories.danger.includes(status)) {
        return ui.colors.danger;
    }
    // Default to primary color
    return ui.colors.primary;
};

/**
 * 📧 Generator Function (Updated for OTP Support)
 */
const generateEmailHtml = (templateConfig, data = {}) => {

    // 1. Validation
    if (!templateConfig) {
        logWithTime("ERROR", "Email Generator: No template configuration provided.");
        return null;
    }

    // 2. Dynamic Color & Badge
    const themeColor = getStatusColor(templateConfig.status);

    let badgeHtml = '';
    if (templateConfig.status && templateConfig.status !== 'Activated') {
        badgeHtml = `<span class="badge" style="background-color: ${themeColor}">${templateConfig.status}</span>`;
    }

    // 3. Inner Content Builder
    let innerContent = `
        <h3>Hi ${data.name || 'There'},</h3>
        <p>${templateConfig.message_intro}</p>
    `;

    // --- 🟢 NEW LOGIC: OTP BLOCK START ---
    // Agar 'data' object mein 'otp' field pass kiya gaya hai, to use highlight karein
    if (data.otp) {
        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code:</p>
                <div style="display: inline-block; padding: 15px 30px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: ${themeColor}; background: #f8f9fa; border: 2px dashed ${themeColor}; border-radius: 8px;">
                    ${data.otp}
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">This code expires in 10 minutes.</p>
            </div>
        `;
    }
    // --- 🟢 NEW LOGIC: OTP BLOCK END ---

    // --- BUTTON LOGIC (Existing) ---
    // Button tabhi banega jab Link ho, aur OTP na ho (ya dono chahiye to condition hata dein)
    else if (templateConfig.actionbutton_text && templateConfig.actionlink) {
        // Link replacement logic
        // Agar data.frontendUrl available hai to use karein, varna process.env se lein
        const baseUrl = data.frontendUrl || process.env.FRONTEND_URL || "#";
        const link = templateConfig.actionlink.replace("<LINK>", baseUrl);

        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="btn" style="background-color: ${themeColor}">${templateConfig.actionbutton_text}</a>
            </div>
        `;
    }

    // --- FALLBACK NOTE ---
    // Change: Hum check kar rahe hain (!data.otp). 
    // Matlab agar OTP bheja hai, to Link wala fallback note mat dikhao.
    if (templateConfig.fallback_note && !data.otp) {

        let note = templateConfig.fallback_note;
        if (data.frontendUrl) {
            note = note.replace("<LINK>", data.frontendUrl);
        }

        innerContent += `
            <div style="background: #f9f9f9; border-left: 4px solid ${themeColor}; padding: 10px 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; word-break: break-all;">${note}</p>
            </div>
        `;
    }

    if (templateConfig.notes) {
        innerContent += `<p style="color: #888; font-size: 12px; margin-top: 30px;"><em>${templateConfig.notes}</em></p>`;
    }

    // 4. Master Template Injection (Same as before)
    let finalHtml = masterEmailTemplate
        .replace("{{content}}", innerContent)
        .replace(/{{status_color}}/g, themeColor)
        .replace("{{badge_html}}", badgeHtml)
        .replace("{{button_color}}", themeColor)
        .replace("{{current_year}}", new Date().getFullYear())
        .replace("{{company_logo}}", defaultConfig.company_logo || "")
        .replace(/{{company_name}}/g, defaultConfig.company_name || "App")
        .replace("{{company_address}}", defaultConfig.company_address || "")
        .replace(/{{support_email}}/g, defaultConfig.support_email || "");

    // 5. Data Injection for other placeholders
    Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return {
        subject: templateConfig.subject,
        html: finalHtml
    };
};

module.exports = { generateEmailHtml };