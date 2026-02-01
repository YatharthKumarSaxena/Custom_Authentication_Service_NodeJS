const {  v4: uuidv4 } = require('uuid');
const { REQUEST_HEADERS } = require('@configs/headers.config');
const { throwInvalidResourceError, logMiddlewareError } = require('@/responses/common/error-handler.response');
const { logWithTime } = require('@/utils/time-stamps.util');
const { isValidUUID } = require('@/utils/id-validators.util');

const requestIdMiddleware = (req, res, next) => {
  const incomingRequestId = req.requestId || req.headers[REQUEST_HEADERS.REQUEST_ID];
  let requestId = incomingRequestId?.trim();
  if (requestId && !isValidUUID(requestId)) {
    logMiddlewareError('checkRequestId', `Invalid Request ID: ${requestId}`,req);
    return throwInvalidResourceError(res, 'Request ID', 'Request ID is not a valid UUID');
  }

  if (!requestId) {
    requestId = uuidv4();
    logWithTime(`✅ Request ID: ${requestId} assigned successfully.`);
  }else {
    logWithTime(`✅ Request ID: ${requestId} assigned successfully.`);
  }

  req.requestId = requestId;

  return next();
};

module.exports = {
    requestIdMiddleware
}