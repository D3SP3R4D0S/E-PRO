let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let session = require('express-session');
const { config } = require("dotenv");
config();

process.env.NODE_ENV = 
  ( process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() == 'production' ) 
  ? 'production' 
  : 'development';

const {
  secureFlag, secret, resave, saveUninitialized
} = require('./routes/config/options');

const csrf = require("csurf");

let app = express();
app.use(session({
  secret : secret,
  resave : resave,
  saveUninitialized :saveUninitialized,
  cookie: {
    secure: secureFlag,
    httpOnly: true
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(csrf({ cookie: true }));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/login'));
app.use('/', require('./routes/project'));
app.use('/', require('./routes/wishlist'));
app.use('/', require('./routes/fixedexpense'));
app.use('/', require('./routes/expendables'))
app.use('/', require('./routes/financialobligation'))
app.use('/api', require('./routes/api'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
