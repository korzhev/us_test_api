var config = require('../config'),
    UserModel = require('../dbWrapper').UserModel,
    AccessTokenModel = require('../dbWrapper').AccessTokenModel,
    crypto = require('crypto'),
    async = require('async'),
    logger = require('../libs/logger')(module),
    passport = require('passport'),
    exec = require('child_process').exec,
    restify = require('restify');

function info(req, res, next) {
    UserModel.findOne({_id: req.user._id}, function(err, user) {
        if (err) {
            logger.error(err.message);
            return next(new restify.errors.InvalidArgumentError(err.message));
        }
        res.json({userId : user._id, userIdType: user.emailType ? 'email' : 'phone'});
        return next();
    });
}

function logout(req, res, next) {
    if (req.params.hasOwnProperty("all")) {
        switch (req.params.all) {
            case 'true':
                AccessTokenModel.remove({userId: req.user._id}, function(err) {
                    if (err) {
                        logger.error(err.message);
                        return next(new restify.errors.InvalidArgumentError(err.message));
                    }
                    res.json({success : true });
                    return next();
                })
                break;
            case 'false':
                AccessTokenModel.findByIdAndRemove(req.authInfo._id, function(err) {
                    if (err) {
                        logger.error(err.message);
                        return next(new restify.errors.InvalidArgumentError(err.message));
                    }
                    res.json({success : true });
                    return next();
                })
                break;
            default:
                return next(new restify.errors.MissingParameterError('Bad request!'));
                break;
        }
    } else {
        return next(new restify.errors.MissingParameterError('Bad request!'));
    }
}

function latency(req, res, next) {
    exec("ping -c 1 " + config.pingHost, 
        function(err, stdout, stderr) {
            if (err) {
                logger.error(err.message);
                next(new restify.errors.InvalidArgumentError(err.message));
            } else {
                res.json({pingTime : stdout.match(/time=\d+.\d+/)[0].substring(5)}); // парсим результат команды ping
                return next();
            }
        }
    );
}

function signin(req, res, next) {
    var params = JSON.parse(req.body);
    UserModel.findOne({_id:params.user}, function(err, user) {
        if (err) {
            logger.error(err.message);
            return next(new restify.errors.InvalidArgumentError(err.message));
        } else {
            if (user && user.checkPassword(params.password)) {
                var accessToken = new AccessTokenModel({ user: params.user });
                accessToken.save(function(err, aToken) {
                    if (err) {
                        logger.error(err.message);
                        return next(new restify.errors.InvalidArgumentError(err.message));
                    }
                    res.json({ token_type: 'bearer', access_token : aToken.token });
                    return next();
                });
            } else {
                return next(new restify.errors.InvalidArgumentError('User with such password does not exist!'));
            }
        } 
    });
}
function signup(req, res, next) {
    var params = JSON.parse(req.body);
    UserModel.findOne({_id:params.user}, function(err, user) {
        if (err) {
            logger.error(err.message);
            return next(new restify.errors.InvalidArgumentError(err.message));
        }
        if (!user) {
            async.series( [
                function(callback) {
                    var user = new UserModel({ user: params.user, password: params.password});
                    user.save(function(err, user) {
                        if(err) callback(err);
                        else callback(null, 'ok');
                    });
                },
                function(callback) {
                    var accessToken = new AccessTokenModel({ user: params.user });
                    accessToken.save(function(err, aToken) {
                        if(err) callback(err);
                        else callback(null, aToken.token);
                    });
                } ], 
                function (err, result){
                    if (err) {
                        logger.error(err.message);
                        return next(new restify.errors.InvalidArgumentError(err.message));
                    } else {
                        res.json({ token_type: 'bearer', access_token : result[1] });
                        return next();
                    }
                }
            );
        } else {
            return next(new restify.errors.InvalidArgumentError('User already exist!'));
        }
    });
}


Handlers = function() {
    return {
        info : info,
        logout : logout,
        latency : latency,
        signin : signin,
        signup : signup
    }
}

module.exports = Handlers();