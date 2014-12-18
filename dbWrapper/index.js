var mongoose = require('mongoose'),
    config = require('../config'),
    crypto = require('crypto'),
    logger = require('../libs/logger')(module);

mongoose.connect(config.db);
var db = mongoose.connection;

db.on('error', function (err) {
    logger.error('connection error:', err.message);
});
db.once('open', function callback () {
    logger.info("Connected to DB!");
});

var Schema = mongoose.Schema;

var User = new Schema({
    emailType: { 
        type: Boolean,
        default: true
    },
    _id: {
        type: String,
        unique: true,
        required: true
    },
    hashPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }
});

User.virtual('user')
    .set(function(user) {
        this._id = user;
        this.emailType = user.indexOf('@') >= 0 ? true : false; // не стал заморачиваться с регуляркой c email или телефон
    });

User.virtual('password')
    .set(function(password) {
        this.salt = crypto.randomBytes(128).toString('base64');
        this.hashPassword = this.encryptPassword(password);
    });

User.methods.encryptPassword = function(password) {
    return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('base64');
};

User.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashPassword;
};

var AccessToken = new Schema({
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

AccessToken.virtual('user')
    .set(function(user) {
        this.userId = user;
        this.token = crypto.randomBytes(32).toString('base64');
    });

module.exports.UserModel = mongoose.model('User', User);
module.exports.AccessTokenModel = mongoose.model('AccessToken', AccessToken);