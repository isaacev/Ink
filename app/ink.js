// ink.js
// v0.2

var Mongoose = require('mongoose');
var Readability = require('readabilitySAX').Readability;
var Parser = require('htmlparser2').Parser;
var Request = require('request');
var Cheerio = require('cheerio');

// set up parser
var readable = new Readability({});
var parser = new Parser(readable, {});

// Block constructor
function Block(tag, opts) {
	opts = opts || {};

	if (opts.canBeEmpty === undefined) {
		var canBeEmpty = true;
	} else {
		var canBeEmpty = opts.canBeEmpty;
	}

	this.tag = tag;
	this.contents = [];
	this.inlineOpen = false;

	this.append = function (text) {
		if (this.inlineOpen === false) {
			this.contents.push(text);
		} else {
			if (this.contents.length) {
				this.contents[this.contents.length - 1].append(text);
			} else {
				this.contents[0].append(text);
			}
		}
	};

	this.open = function (tag, opts) {
		opts = opts || {};

		this.inlineOpen = true;
		this.contents.push(new Block(tag, opts));
	};

	this.close = function () {
		this.inlineOpen = false;
	};

	this.empty = function () {
		if (canBeEmpty === true) {
			return (this.contents.length ? false : true);
		} else {
			return false;
		}
	};

	this.toHTML = function () {
		if (opts.build) {
			return opts.build(this.contents);
		} else {
			var out = '<' + tag + '>';

			for (var i = 0, len = this.contents.length; i < len; i++) {
				if (typeof this.contents[i] === 'string') {
					out += this.contents[i].toString();
				} else {
					out += this.contents[i].toHTML();
				}
			}

			return out + '</' + tag + '>';
		}
	};

	this.toString = function () {
		var out = '';

		for (var i = 0, len = this.contents.length; i < len; i++) {
			out += this.contents[i].toString();
		}

		return out;
	}
}

// load Mongoose models
var Article = require('./models/article.js');

// parse html
// TODO: the async nature of this function is vestigial, remove it
function parse(url, html, callback) {
	// load DOM for jQuery manipulation
	var $ = Cheerio.load(html);

	// remove blacklisted elements and their children
	var blacklist = ['table'];
	for (var i = 0, len = blacklist.length; i < len; i++) {
		$(blacklist[i]).remove();
	}

	parser.write($.html());

	// break HTML down and rebuild in preferred structure
	// lists of permitted block and inline elements
	var blockElems = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'blockquote'];
	var specialElems = ['img', 'a'];

	// chunks of parsed code, the "block tree"
	var blocks = [];

	// placeholder variable
	var selectedBlock;

	readable.getEvents({
		onopentag: function (tag, attrs) {
			if (blockElems.indexOf(tag) > -1) {
				// create Block object to store element data
				blocks.push(new Block(tag));
			} else if (specialElems.indexOf(tag) > -1) {
				switch (tag) {
				case 'a':
					// get the highest block in the block tree
					if (blocks.length > 1) {
						selectedBlock = blocks[blocks.length - 1];
					} else {
						selectedBlock = blocks[0];
					}

					// open inline element within a block element
					selectedBlock.open(tag, {
						// anchor elements have special build function to incorporate
						// their href property into the HTML
						build: function (contents) {
							var out = '<a href="' + attrs.href + '">';

							for (var i = 0, len = contents.length; i < len; i++) {
								if (typeof contents[i] === 'string') {
									out += contents[i].toString();
								} else {
									out += contents[i].toHTML();
								}
							}

							return out + '</a>';
						}
					});
					break;
				case 'img':
					// add heavily customized block element to block tree
					blocks.push(new Block('img', {
						canBeEmpty: false,
						build: function () {
							return '<img src="' + attrs.src + '">';
						}
					}));
					break;
				}
			}
		},
		ontext: function (text) {
			// make sure it isn't an empty text node
			if (text.trim().length) {
				if (blocks.length > 1) {
					selectedBlock = blocks[blocks.length - 1];
				} else {
					selectedBlock = blocks[0];
				}

				// add more text to the highest block in the block tree
				selectedBlock.append(text);
			}
		},
		onclosetag: function (tag) {
			if (blockElems.indexOf(tag) > -1) {
				blocks.push(new Block(tag));
			} else if (specialElems.indexOf(tag) > -1) {
				switch (tag) {
				case 'a':
					if (blocks.length > 1) {
						selectedBlock = blocks[blocks.length - 1];
					} else {
						selectedBlock = blocks[0];
					}

					// close inline element within block element so that 
					// no more text will be added to it
					selectedBlock.close(tag);
					break;
				}
			}
		}
	});

	// remove empty blocks from the block tree
	// remove [edit] tags from headlines (like those on Wikipedia)
	//   Note: loop descends so that elements can be spiced out of array
	//   without damaging the integrity of the index
	for (var i = blocks.length - 1; i >= 0; i--) {
		// check if h# elements have [edit] tag
		if (/h\d/.test(blocks[i].tag)) {
			// remove that tag and replace the text of the element
			// TODO: this process strips the element of any inline elements
			// like links and such. this should be designed for maximum
			// data retention
			blocks[i].contents = [blocks[i].toString().replace(/\s*\[edit\]\s*$/, '')];
		}

		// if blocks declare themselves as empty, remove them from the block tree
		if (blocks[i].empty()) {
			blocks.splice(i, 1);
		}
	}

	// compile HTML and plaintext from block tree
	var html = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
	var text = '';
	for (var i = 0, len = blocks.length; i < len; i++) {
		text += blocks[i].toString();
		html += blocks[i].toHTML();
	}

	callback(null, {
		url: url,
		meta: {
			title: readable.getTitle(),
			author: author($),
			readTime: readTime(text),
			summary: summary(text),
			domain: extractDomain(url)
		},
		content: {
			html: html,
			text: text
		}
	});
}

// try to extract author name from metadata
function author($) {
	return $('meta[name=author]').attr('content') || undefined;
}

// estimate read time (in minutes) by counting number of words and dividing by 200
function readTime(text) {
	var total = (text.split(' ')).length;
	return Math.floor(total / 200) || 1;
}

// get summary from text by taking first 20 words
function summary(text) {
	return (text.split(' ').slice(0, 30)).join(' ') + '...';
}

// extract URL domain
function extractDomain(url) {
	return (url.replace('http://', '').replace('https://', '').split(/[/?#]/))[0];
}

// save article to MongoDB
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

exports.test = parse;
