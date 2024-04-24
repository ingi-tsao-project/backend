const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");

// Resto de la configuración del servidor
const app = express();

//Middlewares

//Set security HTTP headers
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
//if (process.env.NODE_ENV === "develpment") {
//}

//Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this ip, please try again in an hour",
  keyGenerator: function (req /*, res */) {
    // Manejar el encabezado 'X-Forwarded-For' manualmente
    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    return ipAddress;
  },
});
app.use("/api", limiter);

//Body parser, we put a limit to size res
app.use(express.json({ limit: "10kb" }));

//Data sanitization agains NoSQL query injection
app.use(mongoSanitize());

//Data sanitization agains XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

//Time test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

//If not found a route throw a error
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server😖`, 404));
});
app.use(globalErrorHandler);

//exportamos y alaberga
module.exports = app;
