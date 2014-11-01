// app/models/invite.js

var Mongoose = require('mongoose');

// define schema
var inviteSchema = Mongoose.Schema({
	seed: {
		type: Number,
		unique: true,
		required: true
	},
	code: {
		type: String,
		unique: true,
		required: true
	},
	userId: {
		type: String,
		default: 'unassigned'
	},
	used: {
		type: Boolean,
		default: false
	}
});

// expose schema to app
module.exports = Mongoose.model('Invite', inviteSchema);
