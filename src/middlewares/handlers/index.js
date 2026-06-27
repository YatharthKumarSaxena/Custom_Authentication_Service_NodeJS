const { duplicateQueryParameterHandler } = require("./duplicate-query-parameter.handler");
const { malformedJsonHandler } = require("./malformed-json-handler.middleware");
const { unknownRouteHandler } = require("./unknown-route-handler.middleware");

const handlers = {
  malformedJsonHandler,
  unknownRouteHandler,
  duplicateQueryParameterHandler
};

module.exports = {
  handlers
};