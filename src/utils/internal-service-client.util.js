/**
 * Internal Service Client Utility
 * 
 * Reusable axios-based client for internal microservice communication.
 * Provides a generic interface for making authenticated API calls to internal services.
 * 
 * @author Admin Panel Service Team
 * @date 2026-03-06
 */

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { logWithTime } = require("@/utils/time-stamps.util");
const { device } = require("@/configs/security.config");

/**
 * Creates a reusable internal service client with service authentication
 * 
 * @param {string} baseURL - Base URL of the microservice
 * @param {string} serviceToken - Service authentication token
 * @param {string} serviceName - Name of the calling service
 * @param {number} timeout - Request timeout in milliseconds (default: 5000)
 * @param {number} retryAttempts - Number of retry attempts (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Object} Client object with callService method
 */
function createInternalServiceClient(
  baseURL, 
  serviceToken, 
  serviceName, 
  timeout = 5000, 
  retryAttempts = 3, 
  retryDelay = 1000
) {
  
  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      "x-service-token": serviceToken,
      "x-service-name": serviceName,
      "Content-Type": "application/json",
      "x-device-uuid": device.DEVICE_UUID,
      "x-device-type": device.DEVICE_TYPE,
      "x-device-name": device.DEVICE_NAME
    }
  });

  /**
   * Makes an API call to the internal service with retry mechanism
   * 
   * @param {Object} config - Request configuration
   * @param {string} config.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} config.uri - API endpoint URI
   * @param {Object} [config.body] - Request body data
   * @param {Object} [config.query] - URL query parameters
   * @param {Object} [config.headers] - Additional headers
   * @returns {Promise<Object>} Response object { success: boolean, data?: any, error?: string }
   */
  const callService = async ({
    method = "GET",
    uri,
    body = {},
    query = {},
    headers = {}
  }) => {
    let lastError = null;

    // Retry loop
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Add unique request ID for tracing
        const requestId = uuidv4();
        
        const response = await instance({
          method,
          url: uri,
          data: body,
          params: query,
          headers: {
            "x-request-id": requestId,
            ...headers
          }
        });

        logWithTime(`✅ [${method}] ${uri} - Success ${attempt > 1 ? `(attempt ${attempt})` : ''}`);
        
        return {
          success: true,
          data: response.data
        };

      } catch (err) {
        lastError = err;
        
        // If this is not the last attempt, retry
        if (attempt < retryAttempts) {
          logWithTime(`⚠️  [${method}] ${uri} - Failed (attempt ${attempt}/${retryAttempts}). Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // Last attempt failed
          logWithTime(`❌ [${method}] ${uri} - Failed after ${retryAttempts} attempts: ${err.message}`);
        }
      }
    }

    // All retries exhausted, return error
    if (lastError.response) {
      // Server responded with error status
      return {
        success: false,
        error: lastError.response.data || lastError.message,
        statusCode: lastError.response.status
      };
    } else if (lastError.request) {
      // Request made but no response received
      return {
        success: false,
        error: "Service is not reachable",
        message: lastError.message
      };
    } else {
      // Error in setting up the request
      return {
        success: false,
        error: lastError.message
      };
    }
  };

  return { callService };
}

module.exports = { createInternalServiceClient };
