var winston = require('winston');

module.exports = function() {
  var transports = [
    new winston.transports.Console({
      timestamp: true,
      colorize: true,
      level: 'debug'
    })
    // , new winston.transports.File({
    //   filename: 'logs/error.log',
    //   colorize: false,
    //   level: 'error',
    //   maxsize: 4*1024*1024,
    //   json: false
    // })
  ];

  return new winston.Logger({ transports: transports });
};