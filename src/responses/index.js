// Export all error handler responses
const errorHandlers = require('./common/error-handler.response');

// Export all success responses
const successHandlers = require('./success');

module.exports = {
    ...errorHandlers,
    ...successHandlers
};
