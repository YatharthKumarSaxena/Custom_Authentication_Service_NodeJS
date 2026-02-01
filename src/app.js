const express = require("express");
const cookieParser = require("cookie-parser");

const { globalLimiter } = require("@rate-limiters/global.rate-limiter");
const { malformedJsonHandler } = require("@middlewares/handlers/malformed-json-handler.middleware");
const { unknownRouteHandler } = require("@middlewares/handlers/unknown-route-handler.middleware");

const app = express();

const jsonParser = express.json;

// Order is VERY IMPORTANT

// 1. Global rate limiter (protect entire server)
app.use(globalLimiter);

// 2. JSON body parser (must be before routes)
app.use(jsonParser());

// 3. Cookie parser
app.use(cookieParser());

// 4. Malformed JSON handler (should come AFTER express.json)
app.use(malformedJsonHandler);

// 5. Routes
require("@routes/index")(app);

// 6. Unknown route fallback
app.use(unknownRouteHandler);

module.exports = { app };