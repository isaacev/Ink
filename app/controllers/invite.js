// app/controllers/invite.js

var Invite = require('../models/invite.js');

exports.addInvite = function (req, res, next) {
	var newInvite = new Invite();

	newInvite.seed = req.body.seed;
	newInvite.code = req.body.code;

	newInvite.save(function (err) {
		res.locals = newInvite;
		next();
	});
};

exports.getInvite = function (req, res, next) {
	Invite.findOne({
		code: req.params.code
	}, function (err, invite) {
		if (err) {
			res.send(err);
		}

		res.locals = invite;
		next();
	})
};

exports.getAllocatedInvites = function (req, res, next) {
	Invite.find({
		userId: req.user._id
	}, function (err, invites) {
		if (err) {
			res.send(err);
		}

		res.locals = invites;
		next();
	});
};

exports.getUnassignedInvites = function (req, res, next) {
	Invite.find({
		userId: 'unassigned'
	}, function (err, invites) {
		if (err) {
			res.send(err);
		}

		res.locals = invites;
		next();
	});
};
