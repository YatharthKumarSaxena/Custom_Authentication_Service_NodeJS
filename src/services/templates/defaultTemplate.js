/**
 * 🎯 Default Template Configuration
 * Common config that all templates will inherit
 */
const defaultConfig = {
  company_name: 'Admin Panel',
  user_name: '', // Will be set dynamically
  message_intro: '',
  event_name: '',
  action: '',
  status: null,
  action_cta: '',
  actionbutton_text: '',
  actionlink: '',
  fallback_note: '',
  action_link: '',
  notes: '',
  details: {},
  currentyear: new Date().getFullYear()
};

module.exports = {
  defaultConfig
};