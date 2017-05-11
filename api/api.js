import feathers from 'feathers';
import feathersLogger from 'feathers-logger';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import hooks from 'feathers-hooks';
import rest from 'feathers-rest';
import swagger from 'feathers-swagger';
import socketio from 'feathers-socketio';
import isPromise from 'is-promise';
import publicConfig from '../src/config';
import config from './config';
import middleware from './middleware';
import services from './services';
import * as actions from './actions';
import { winston, requestLogger } from './logger';
import { mapUrl } from './utils/url.js';
import auth, { socketAuth } from './services/authentication';

process.on('unhandledRejection', (error) => {
  error.name = 'UnhandledException';
  winston.error(error);
});

const app = feathers();

app.set('config', config)
  .configure(feathersLogger(winston))
  .use(requestLogger)
  .use(cookieParser())
  .use(session({
    secret: config.auth.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  }))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json());

const actionsHandler = (req, res, next) => {
  const splittedUrlPath = req.url.split('?')[0].split('/').slice(1);

  const { action, params } = mapUrl(actions, splittedUrlPath);

  const catchError = (error) => {
    error.name = 'APIException';
    winston.error(error);
    res.status(error.status || 500).json({
      error: {
        name: error.name,
        message: error.message,
        code: error.status || 500,
      },
    });
  };

  req.app = app;

  if (action) {
    try {
      const handle = action(req, params);
      (isPromise(handle) ? handle : Promise.resolve(handle))
        .then((result) => {
          if (result instanceof Function) {
            result(res);
          } else {
            res.json(result);
          }
        })
        .catch((reason) => {
          if (reason && reason.redirect) {
            res.redirect(reason.redirect);
          } else {
            catchError(reason);
          }
        });
    } catch (error) {
      catchError(error);
    }
  } else {
    next();
  }
};

app.configure(hooks())
  .configure(rest())
  .configure(socketio({ path: '/ws' }))
  .configure(auth)
  .configure(swagger({
    docsPath: '/docs',
    uiIndex: true,
    info: {
      title: 'API Docs',
      description: 'This is the description of api docs',
    },
  }))
  .use(actionsHandler)
  .configure(services)
  .configure(middleware);

if (publicConfig.apiPort) {
  app.listen(publicConfig.apiPort, (err) => {
    if (err) {
      err.name = 'StartupException';
      winston.error(err);
    }
    winston.info('==> ☁️  API is running on port %s', publicConfig.apiPort);
    winston.info('==> 💻  Send requests to http://%s:%s', publicConfig.apiHost, publicConfig.apiPort);
  });
} else {
  const err = new Error('No APIPORT environment variable has been specified');
  err.name = 'StartupException';
  winston.error(err);
}

const bufferSize = 100;
const messageBuffer = new Array(bufferSize);
let messageIndex = 0;

app.io.use(socketAuth(app));

app.io.on('connection', (socket) => {
  const user = socket.feathers.user ? { ...socket.feathers.user, password: undefined } : undefined;
  socket.emit('news', { msg: `Welcome to ${publicConfig.app.title}`, user });

  socket.on('history', () => {
    for (let index = 0; index < bufferSize; index++) {
      const msgNo = (messageIndex + index) % bufferSize;
      const msg = messageBuffer[msgNo];
      if (msg) {
        socket.emit('msg', msg);
      }
    }
  });

  socket.on('msg', (data) => {
    const message = { ...data, id: messageIndex };
    messageBuffer[messageIndex % bufferSize] = message;
    messageIndex++;
    app.io.emit('msg', message);
  });

  socket.on('clientErrorLog', (error) => {
    error.name = 'ClientException';
    winston.error(error);
  });
});
