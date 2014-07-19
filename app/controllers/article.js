// app/controllers/article.js

var Ink = require('../ink.js');
var Article = require('../models/article.js');

exports.addArticle = function (req, res, next) {
	Ink.parse(req.body.url, function (err, article) {
		if (err) {
			res.send(err);
		}

		var newArticle = new Article();

		newArticle.userId = req.user._id;
		newArticle.url = article.url;

		newArticle.meta.title = article.meta.title;
		newArticle.meta.author = article.meta.author;
		newArticle.meta.readTime = article.meta.readTime;
		newArticle.meta.summary = article.meta.summary;
		newArticle.meta.domain = article.meta.domain;

		newArticle.content.html = article.content.html;
		newArticle.content.text = article.content.text;

		newArticle.save(function (err) {
			if (err) {
				res.send(err);
			}

			res.locals = newArticle;
			next();
		});
	});
};

exports.getArticles = function (req, res, next) {
	var callback = function (err, articles) {
		if (err) {
			res.send(err);
		}

		// sort articles by date (newest -> oldest)
		articles.sort(function (a, b) {
			return b.meta.createdAt - a.meta.createdAt;
		});

		res.locals = articles;
		next();
	};

	// resolve article filters
	if (req.query.filter == 'starred') {
		Article.find({
			userId: req.user._id,
			'meta.archived': false,
			'meta.starred': true
		}, callback);
	} else if (req.query.filter == 'archive') {
		Article.find({
			userId: req.user._id,
			'meta.archived': true
		}, callback);
	} else {
		Article.find({
			userId: req.user._id
		}, callback);
	}
};

exports.getArticle = function (req, res, next) {
	Article.findOne({
		userId: req.user._id,
		_id: req.params.article_id
	}, function (err, article) {
		if (err) {
			res.json({
				error: 'could not find article with id "' + req.params.article_id + '"'
			});
		}

		res.locals = article;
		next();
	});
};

exports.starArticle = function (req, res, next) {
	Article.findOne({
		userId: req.user._id,
		_id: req.params.article_id
	}, function (err, article) {
		if (err) {
			res.send(err);
		}

		if (article.meta.starred === false) {
			article.meta.starred = true;
		} else {
			article.meta.starred = false;
		}

		article.save(function (err) {
			if (err) {
				res.send(err);

			}

			res.locals = article;
			next();
		});
	});
};

exports.archiveArticle = function (req, res, next) {
	Article.findOne({
		userId: req.user._id,
		_id: req.params.article_id
	}, function (err, article) {
		if (err) {
			res.send(err);
		}

		if (article.meta.archive === false) {
			article.meta.archive = true;
		} else {
			article.meta.archive = false;
		}

		article.save(function (err) {
			if (err) {
				res.send(err);

			}

			res.locals = article;
			next();
		});
	});
};

exports.deleteArticle = function (req, res, next) {
	Article.findByIdAndRemove(req.params.article_id, function (err) {
		if (err) {
			res.send(err);
		}

		res.locals = {
			message: 'article removed'
		};
		next();
	});
};
