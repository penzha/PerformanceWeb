var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var flash = require('connect-flash');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//session
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }/*,	//??? if we change to true, it will make req.flash() not works. ???
	store: new MongoStore({
		//username: settings.username,
		//password: settings.password,
		db: settings.db
	})*/
}));

//flash
app.use(flash());

app.use('/', routes);
app.use('/users', users);


// MongoDB configuration
// var MongoStore = require('connect-mongo')(session);  // not use session yet.
var MongoStore = require('connect-mongo');
var settings = require('./models/settings');
var db = require('./models/db');

/* Not use session yet.
//session
app.use(session({
	secret: settings.cookieSecret,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false },	//??? if we change to true, it will make req.flash() not works. ???
	store: new MongoStore({
		//username: settings.username,
		//password: settings.password,
		db: settings.db
	})
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
