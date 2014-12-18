var restify = require('restify'),
	server = restify.createServer(),
    config = require('./config'),
    Handlers = require('./handlers'),
	logger = require('./libs/logger')(module)
	passport = require('passport');


server.use(restify.CORS());
server.use(restify.queryParser());
server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.use(passport.initialize());

require('./libs/auth');

server.get('/info', passport.authenticate('bearer', { session: false }), Handlers.info);
server.get('/logout', passport.authenticate('bearer', { session: false }), Handlers.logout);
server.get('/latency', passport.authenticate('bearer', { session: false }), Handlers.latency);

server.post('/signin', Handlers.signin);
server.post('/signup ', Handlers.signup);


server.listen(config.port, function() {
  logger.info('server up & listening at %s', server.url);
});
