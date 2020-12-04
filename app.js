const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const soundboardRouter = require('./routes/soundboardRoutes');
const paymentRouter = require('./routes/paymentRoutes')
const membershipTypeRouter = require('./routes/membershipTypeRoutes');
const membershipRouter = require('./routes/membershipRoutes')
const paymentController = require('./controllers/paymentController')

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middlewares
const corsOptions = {
  origin: `${process.env.HOST}`,
  credentials: true,
};

// Use cors
app.use(cors(corsOptions));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP headers
app.use(helmet());

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 500,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Webhooks
app.post('/webhook-checkout', bodyParser.raw({ type: 'application/json' }), paymentController.webhookCheckout)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// app.use(
//   hpp({
//     whitelist: [
//       'price'
//     ]
//   })
// );

// Compress text sent to client
app.use(compression());

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/soundboards', soundboardRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/membershipTypes', membershipTypeRouter);
app.use('/api/v1/memberships', membershipRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
