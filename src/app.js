const express = require("express");
const cookieParser = require("cookie-parser");

const { globalLimiter } = require("@rate-limiters/global.rate-limiter");
const { malformedJsonHandler } = require("@middlewares/handlers/malformed-json-handler.middleware");
const { unknownRouteHandler } = require("@middlewares/handlers/unknown-route-handler.middleware");
const { corsMiddleware } = require("@middlewares/common/cors.middleware");

const app = express();

const jsonParser = express.json;

// Order is VERY IMPORTANT

// 1. CORS middleware (must be FIRST before everything else)
app.use(corsMiddleware);

// 2. Global rate limiter (protect entire server)
app.use(globalLimiter);

// 3. JSON body parser (must be before routes)
app.use(jsonParser());

// 4. Cookie parser
app.use(cookieParser());

// 5. Malformed JSON handler (should come AFTER express.json)
app.use(malformedJsonHandler);

// 6. Routes
require("@/routes/index")(app);

// 7. Unknown route fallback
app.use(unknownRouteHandler);

module.exports = { app };