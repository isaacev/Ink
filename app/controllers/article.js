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
	Article.find({
		userId: req.user._id
	}, function (err, articles) {
		if (err) {
			res.send(err);
		}

		res.locals = articles;
		next();
	});
};

exports.getArticle = function (req, res, next) {
	Article.findOne({
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

exports.putArticle = function (req, res, next) {
	Article.findOne({
		_id: req.params.article_id
	}, function (err, article) {
		if (err) {
			res.send(err);
		}

		article.meta.title = req.params.title || article.meta.title;
		article.meta.author = req.params.author || article.meta.author;
		article.meta.readTime = req.params.readTime || article.meta.readTime;
		article.meta.summary = req.params.summary || article.meta.summary;
		article.meta.domain = req.params.domain || article.meta.domain;
		article.content.html = req.params.content || article.content.html;
		article.content.text = req.params.text || article.content.text;

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

exports.searchArticles = function (req, res, next) {
	console.log('QUERY:', req.params.query);
	Article.textSearch(req.params.query, function (err, output) {
		if (err) {
			res.send(err);
		}

		res.locals = arguments;
		next();
	});
};
