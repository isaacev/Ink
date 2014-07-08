// config/passport.js

var LocalStrategy = require('passport-local').Strategy;

// load models
var User = require('../app/models/user.js');
var Invite = require('../app/models/invite.js');

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
				} else if (req.body.invite === 'override') {
					// TODO: this override is only temporary
					// create new user
					var newUser = new User();

					// set the user's local credentials
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					// save the user
					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						// assign three available invites to new user
						Invite.find({
							userId: 'unassigned'
						}, function (err, invites) {
							if (err) {
								console.log(err);
								return done(null, newUser);
							}

							// assign and save each invite
							invites[0].userId = newUser._id;
							invites[0].save(function (err) {
								invites[1].userId = newUser._id;
								invites[1].save(function (err) {
									invites[2].userId = newUser._id;
									invites[2].save(function (err) {
										return done(null, newUser);
									});
								});
							});
						});
					});
				} else {
					// there is no user with that email
					// so check if invitation code is valid and unused
					Invite.findOne({
						code: req.body.invite
					}, function (err, invite) {
						if (err) {
							return done(err);
						}

						if (invite) {
							if (invite.used === false) {
								// disable the used invite
								invite.used = true;

								// and save that change to the database
								invite.save(function (err) {
									if (err) {
										throw err;
									}
								});

								// create new user
								var newUser = new User();

								// set the user's local credentials
								newUser.local.email = email;
								newUser.local.password = newUser.generateHash(password);

								// save the user
								newUser.save(function (err) {
									if (err) {
										throw err;
									}

									// assign three available invites to new user
									Invite.find({
										userId: 'unassigned'
									}, function (err, invites) {
										if (err) {
											console.log(err);
											return done(null, newUser);
										}

										// assign and save each invite
										// make sure there are enough unassigned invites for 1
										if (invites.length > 1) {
											invites[0].userId = newUser._id;
											invites[0].save(function (err) {

												// make sure there are enough unassigned invites for 2
												if (invites.length > 2) {
													invites[1].userId = newUser._id;
													invites[1].save(function (err) {

														// and make sure there are enough unassigned invites for 3
														if (invites.length > 3) {
															invites[2].userId = newUser._id;
															invites[2].save(function (err) {
																return done(null, newUser);
															});
														} else {
															// if there aren't enough invites, just be done
															return done(null, newUser);
														}
													});
												} else {
													// if there aren't enough invites, just be done
													return done(null, newUser);
												}
											});
										} else {
											// if there aren't enough invites, just be done
											return done(null, newUser);
										}
									});
								});
							} else {
								return done(null, false, req.flash('signupMessage', 'That invite has already been used'));
							}
						} else {
							return done(null, false, req.flash('signupMessage', 'That invite does not exist'));
						}
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
