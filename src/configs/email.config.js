/**
 * UI Configuration
 * Defines colors and status mappings (Design Tokens)
 */
const uiConfig = {
    colors: {
        success: '#4caf50', // Green
        warning: '#f59e0b', // Amber
        danger: '#ef4444',  // Red
        neutral: '#6b7280', // Grey
        primary: '#007bff'  // Brand Color
    },
    status_categories: {
        success: ['Approved', 'Success', 'Activated', 'Unblocked', 'Completed', 'Verified'],
        warning: ['Pending', 'Submitted', 'Processing', 'On Hold', 'Review', 'Warning'],
        danger:  ['Rejected', 'Failed', 'Deactivated', 'Blocked', 'Suspended', 'Expired', 'Deleted']
    }
};

/**
 * Master HTML Template
 */
const masterEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px; background-color: #ffffff; border-bottom: 3px solid {{status_color}}; }
        .logo-img { max-height: 50px; width: auto; display: block; margin: 0 auto; }
        .badge { display: inline-block; padding: 6px 12px; font-size: 12px; font-weight: bold; color: #fff; background-color: {{status_color}}; border-radius: 12px; margin-top: 10px; }
        .content { padding: 30px 20px; color: #444; line-height: 1.6; font-size: 16px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; background-color: {{button_color}}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #999; padding: 20px; background-color: #f9f9f9; border-top: 1px solid #eee; }
        .footer a { color: #666; text-decoration: none; }
        .address { margin-top: 10px; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{company_logo}}" alt="{{company_name}}" class="logo-img" />
            {{badge_html}} 
        </div>
        
        <div class="content">
            {{content}}
        </div>

        <div class="footer">
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
            <p class="address">{{company_address}}</p>
            <p>Need help? Contact <a href="mailto:{{support_email}}">{{support_email}}</a></p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Default Template Configuration
 * Merged UI + Branding + Defaults
 */
const defaultConfig = {
  // --- Branding ---
  company_name: process.env.APP_NAME || 'Auth Service', 
  company_logo: process.env.COMPANY_LOGO || 'https://via.placeholder.com/150',
  support_email: process.env.SUPPORT_EMAIL || 'support@example.com',
  company_address: process.env.COMPANY_ADDRESS || 'Earth, Milky Way',

  // --- Defaults ---
  user_name: 'User', 
  message_intro: '',
  actionbutton_text: '',  
  actionlink: '',      
  fallback_note: '',    
  notes: '',            
  details: {},          
  currentyear: new Date().getFullYear(),

  // --- UI Injection ---
  ui: uiConfig 
};

module.exports = { 
    defaultConfig,
    masterEmailTemplate,
};