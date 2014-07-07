// app/models/article.js

var Mongoose = require('mongoose');

// define article schema
var articleSchema = Mongoose.Schema({
	url: {
		type: String,
		required: true
	},
	tags: [String],
	userId: {
		type: String,
		required: true
	},
	meta: {
		title: String,
		author: String,
		readTime: String,
		summary: String,
		domain: String,
		starred: {
			type: Boolean,
			default: false
		},
		archived: {
			type: Boolean,
			default: false
		}
	},
	content: {
		html: String,
		text: String
	}
});

module.exports = Mongoose.model('Article', articleSchema);
