// server.js

var Express = require('express');
var Mongoose = require('mongoose');
var Passport = require('passport');
var Flash = require('connect-flash');
var Morgan = require('morgan');
var CookieParser = require('cookie-parser');
var BodyParser = require('body-parser');
var Session = require('express-session');

var Vars = require('./config/vars.js');

// configuration
Mongoose.connect(Vars.database);

require('./config/passport')(Passport);

// set up Express
var app = Express();
app.use(Morgan('dev'));
var port = Number(process.env.PORT || 3000);
app.use(CookieParser());
app.use(BodyParser());

app.set('view engine', 'ejs');

// required for Passport
app.use(Session({
	secret: Vars.session
}));
app.use(Passport.initialize());
app.use(Passport.session());
app.use(Flash());

// site routes
require('./app/routes.js')(app, Passport);

// launch
app.listen(port);
console.log('the magic happens on port ' + port);
