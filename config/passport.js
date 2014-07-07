// config/passport.js

var LocalStrategy = require('passport-local').Strategy;

// load user model
var User = require('../app/models/user.js');

module.exports = function (passport) {
	////////// PASSPORT SESSION SETUP //////////
	// required for persistent signin sessions
	// passport needs the ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	////////// LOCAL SIGNUP //////////
	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, so override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, function (req, email, password, done) {
		// User.findOne won't fire unless data is sent back
		process.nextTick(function () {
			// find a user whose email is the same as the form's email
			// check to see if the user trying to signin already exists
			User.findOne({
				'local.email': email
			}, function (err, user) {
				if (err) {
					return done(err);
				}

				// check to see if there's already a user with that email
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken'));
				} else {
					// there is no user with that email
					// so create new user
					var newUser = new User();

					// set the user's local credentials
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					// save the user
					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
	}));

	////////// LOCAL SIGNIN //////////
	passport.use('local-signin', new LocalStrategy({
		// override username with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, function (req, email, password, done) {
		// find a user whose email is the same as the form's email
		// check to see if the user trying to signin already exists
		User.findOne({
			'local.email': email
		}, function (err, user) {
			if (err) {
				return done(err);
			}

			// if no user is found, return the message
			if (!user) {
				return done(null, false, req.flash('signinMessage', 'No user found.'));
			}

			if (!user.validPassword(password)) {
				return done(null, false, req.flash('signinMessage', 'Oops! Wong password.'));
			}

			// all is well, return successful user
			return done(null, user);
		});
	}));
};
