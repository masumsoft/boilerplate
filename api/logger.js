import winston from 'winston';
import expressWinston from 'express-winston';

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  level: 'debug',
  colorize: true,
  timestamp: false,
  json: false,
  handleExceptions: true,
  humanReadableUnhandledException: true,
});
winston.add(winston.transports.File, {
  level: 'warn',
  filename: 'logs/app.log',
  maxsize: 10 * 1024 * 1024,
  maxFiles: 10,
  logstash: true,
  tailable: true,
  handleExceptions: true,
});

expressWinston.requestWhitelist.push('session');

const requestLogger = expressWinston.logger({
  meta: false,
  expressFormat: true,
  winstonInstance: winston,
});

const errorLogger = expressWinston.errorLogger({
  winstonInstance: winston,
});

export { winston, requestLogger, errorLogger };
