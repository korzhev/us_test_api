var passport = require('passport'),
    UserModel = require('../dbWrapper').UserModel,
    AccessTokenModel = require('../dbWrapper').AccessTokenModel,
    config = require('../config'),
    BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(new BearerStrategy(
    function(accessToken, done) {
        AccessTokenModel.findOne({ token: accessToken }, function(err, token) {
            if (err) { return done(err); }
            if (!token) { return done(null, false); }
            if( token.created <= (Date.now() - config.liveTime) ) {
                return done(null, false, { message: 'Token expired!' });
            }
            
            UserModel.findById(token.userId, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown user!' }); }
                
                AccessTokenModel.findByIdAndUpdate(token._id , { '$set': { created: Date.now() }}, function(err, token) {
                    if (err) { return done(err); }
                    return done(null, user, token);
                });
            });
        });
    }
));
