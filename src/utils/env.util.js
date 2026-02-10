/**
 * Utility function to safely get environment variables
 * Provides a centralized way to access process.env variables with optional default values
 * 
 * @param {string} key - The environment variable key
 * @param {*} defaultValue - Optional default value if the env variable is not set
 * @returns {string|undefined} The environment variable value or default value
 */
const getMyEnv = (key, defaultValue = undefined) => {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
};

/**
 * Get environment variable as a number
 * @param {string} key - The environment variable key
 * @param {number} defaultValue - Optional default value
 * @returns {number} The environment variable value as a number
 */
const getMyEnvAsNumber = (key, defaultValue = 0) => {
  const value = getMyEnv(key);
  return value ? Number(value) : defaultValue;
};

/**
 * Get environment variable as a boolean
 * @param {string} key - The environment variable key
 * @param {boolean} defaultValue - Optional default value
 * @returns {boolean} The environment variable value as a boolean
 */
const getMyEnvAsBool = (key, defaultValue = false) => {
  const value = getMyEnv(key);
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Get environment variable as an array (comma-separated values)
 * @param {string} key - The environment variable key
 * @param {Array} defaultValue - Optional default value
 * @returns {Array} The environment variable value as an array
 */
const getMyEnvAsArray = (key, defaultValue = []) => {
  const value = getMyEnv(key);
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
};

module.exports = {
  getMyEnv,
  getMyEnvAsNumber,
  getMyEnvAsBool,
  getMyEnvAsArray
};
