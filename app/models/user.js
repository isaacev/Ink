// app/models/user.js

var Mongoose = require('mongoose');
var Bcrypt = require('bcrypt-nodejs');

// define user schema
var userSchema = Mongoose.Schema({
	email: String,
	password: String
});

// generating a hash
userSchema.methods.generateHash = function(password) {
	return Bcrypt.hashSync(password, Bcrypt.genSaltSync(8), null);
};

// check if password is valid
userSchema.methods.validPassword = function (password) {
	return Bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to app
module.exports = Mongoose.model('User', userSchema);
