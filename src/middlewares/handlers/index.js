const { malformedJsonHandler } = require("./malformed-json-handler.middleware");
const { unknownRouteHandler } = require("./unknown-route-handler.middleware");

const handlers = {
  malformedJsonHandler,
  unknownRouteHandler
};

module.exports = {
  handlers
};