// config/database.js

module.exports = {
	session: process.env.SESSION || 'foobarbaz',
	database: process.env.MONGOLAB_URI || 'mongodb://localhost:27017/ink'
};

