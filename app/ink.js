// ink.js

var Mongoose = require('mongoose');
var Cheerio = require('cheerio');
var Request = require('request');
var Readability = require('node-readability');

// load article model
var Article = require('./models/article.js');

// parse html
function parse(url, html, callback) {
	Readability(html, function (err, doc) {
		if (err) {
			return callback(err);
		}

		var $ = Cheerio.load(doc.content);

		var text = $('body').text();

		callback(null, {
			url: url,
			meta: {
				title: doc.title.trim(),
				author: author($),
				readTime: readTime(text),
				summary: summary(text),
				domain: extractDomain(url)
			},
			content: {
				html: $.html(),
				text: text
			}
		});
	});
}

// clean up HTML in a variety of heuristic ways
function sanitize($) {
	try {
		// remove Wikipedia [edit] tags from headlines
		$('h1, h2, h3, h4, h5, h6').each(function (index, element) {
			$(element).find('.mw-editsection').remove();

			$(element).text(($(element).text()).replace('[edit]', ''));
		});
	} catch (err) {
		// couldn't remove [edit] tags
	}

	try {
		// removes most empty elements
		$('*').filter(function () {
			return (($(this).text()).trim() === '');
		}).remove();
	} catch (err) {
		// couldn't remove empty tags
	}

	return $;
}

// try to extract author from metadata
function author($) {
	return $('meta[name=author]').attr('content') || undefined;
}

// estimate read time (in minutes) by counting words and dividing by 200
function readTime(words) {
	var total = (words.split(' ')).length;
	console.log('TOTAL WORDS:', words);
	return Math.floor(total / 200) || 1;
}

// get summary form text
function summary(text) {
	return text.split(' ').slice(0, 20);
}

// extract URL domain
function extractDomain(url) {
	return (url.replace('http://', '').replace('https://', '').split(/[/?#]/))[0];
}

// saves article to MongoDB
exports.parse = function (url, callback) {
	Request(url, function (err, res, html) {
		if (err) {
			res.send(err);
		}

		parse(url, html, function (err, article) {
			callback(null, article);
		});
	});
};
