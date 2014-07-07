// app/routes.js

var ArticleController = require('./controllers/article.js');

module.exports = function (app, passport) {

	////////// RENDERING //////////

	// render static files
	app.get('/static/*', function (req, res) {
		// var uid = req.params.uid;
		var path = req.params[0] ? req.params[0] : 'index.html';
		res.sendfile(path, {
			root: './static'
		});
	});

	// render index
	app.get('/', function (req, res) {
		if (req.user) {
			res.redirect('/library');
		} else {
			res.render('index.ejs', {
				user: req.user
			});
		}
	});

	// render signup form
	app.get('/signup', function (req, res) {
		res.render('signup.ejs', {
			user: req.user,
			message: req.flash('signupMessage')
		});
	});

	// render signin form
	app.get('/signin', function (req, res) {
		res.render('signin.ejs', {
			user: req.user,
			message: req.flash('signinMessage')
		});
	});

	// render library
	app.get('/library', userIsSignedIn, ArticleController.getArticles, function (req, res) {
		res.render('library.ejs', {
			user: req.user,
			articles: res.locals
		});
	});

	// render account
	app.get('/account', userIsSignedIn, function (req, res) {
		res.render('account.ejs', {
			user: req.user
		});
	});

	// render add form
	app.get('/add', userIsSignedIn, function (req, res) {
		res.render('add.ejs', {
			user: req.user
		});
	});

	// render read article
	app.get('/read/:article_id', userIsSignedIn, ArticleController.getArticle, function (req, res) {
		if (req.query.raw == 'true') {
			res.render('raw.ejs', {
				user: req.user,
				article: res.locals
			});
		} else {
			res.render('read.ejs', {
				user: req.user,
				article: res.locals
			});
		}
	});



	////////// PROCESSING //////////

	// process the signin form
	app.post('/signin', passport.authenticate('local-signin', {
		successRedirect: '/library',
		failureRedirect: '/signin',
		failureFlash: true
	}));

	// process signout
	app.get('/signout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/library',
		failureRedirect: '/signup',
		failureFlash: true
	}));

	// process the add form
	app.post('/add', userIsSignedIn, ArticleController.addArticle, function (req, res) {
		res.redirect('/library');
	});

	// process article deletion
	app.delete('/delete/:article_id', userIsSignedIn, ArticleController.deleteArticle, function (req, res) {
		res.json(res.locals);
	});

	app.get('/search/:query', ArticleController.searchArticles, function (req, res) {
		res.json(res.locals);
	});



	////////// APPLICATION PROGRAMMING INTERFACE //////////

	// add an article
	app.post('/api/1/articles/add', serviceIsSignedIn, ArticleController.addArticle, function (req, res) {
		res.json(res.locals);
	});

	// get all articles for user
	app.get('/api/1/articles', serviceIsSignedIn, ArticleController.getArticles, function (req, res) {
		res.json(res.locals);
	});

	// get an article
	app.get('/api/1/articles/:article_id', serviceIsSignedIn, ArticleController.getArticle, function (req, res) {
		res.json(res.locals);
	});

	// change an article
	app.put('/api/1/articles/:article_id', serviceIsSignedIn, ArticleController.putArticle, function (req, res) {
		res.json(res.locals);
	});

	// delete an article
	app.delete('/api/1/articles/:article_id', serviceIsSignedIn, ArticleController.deleteArticle, function (req, res) {
		res.json(res.locals);
	});
};

// route middleware to make sure a user is signed in
function userIsSignedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		return next();
	}

	// if they aren't authenticated, redirect them to the signin page
	res.redirect('/signin?next=library');
}

function serviceIsSignedIn(req, res, next) {
	// if service is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		return next();
	}

	// if they aren't authenticated, serve an error
	res.statusCode = 401;
	res.json({
		error: 'unauthorized'
	});
}
