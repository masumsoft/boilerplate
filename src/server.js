import express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';
import favicon from 'serve-favicon';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import httpProxy from 'http-proxy';
import path from 'path';
import http from 'http';
import { match } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ReduxAsyncConnect, loadOnServer } from 'redux-connect';
import createHistory from 'react-router/lib/createMemoryHistory';
import { Provider } from 'components';
import config from 'config';
import createStore from 'redux/create';
import ApiClient from 'helpers/ApiClient';
import Html from 'helpers/Html';
import getRoutes from 'routes';
import { createApp } from 'app';

import { winston } from '../api/logger';

process.on('unhandledRejection', (error) => {
  error.name = 'UnhandledException';
  winston.error(error);
});

const targetUrl = `http://${config.apiHost}:${config.apiPort}`;
const app = express();
const server = new http.Server(app);
const proxy = httpProxy.createProxyServer({
  target: targetUrl,
  ws: true,
});

app.use(cookieParser());
app.use(compression());
app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.ico')));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, '..', 'static', 'manifest.json')));

app.use(express.static(path.join(__dirname, '..', 'static')));

app.use((req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '*');
  res.setHeader('X-Forwarded-For', req.ip);
  return next();
});

// Proxy to API server
app.use('/api', (req, res) => {
  proxy.web(req, res, { target: targetUrl });
});

app.use('/ws', (req, res) => {
  proxy.web(req, res, { target: `${targetUrl}/ws` });
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// added the error handling to avoid https://github.com/nodejitsu/node-http-proxy/issues/527
proxy.on('error', (error, req, res) => {
  if (error.code !== 'ECONNRESET') {
    error.name = 'ProxyException';
    winston.error(error);
  }
  if (!res.headersSent) {
    res.writeHead(500, { 'content-type': 'application/json' });
  }

  const json = { error: 'proxy_error', reason: error.message || error };
  res.end(JSON.stringify(json));
});

app.use((req, res) => {
  if (__DEVELOPMENT__) {
    // Do not cache webpack stats: the script file would change since
    // hot module replacement is enabled in the development env
    webpackIsomorphicTools.refresh();
  }
  const providers = {
    client: new ApiClient(req),
    app: createApp(req),
    restApp: createApp(req),
  };
  const memoryHistory = createHistory(req.originalUrl);
  const store = createStore(memoryHistory, providers);
  const history = syncHistoryWithStore(memoryHistory, store);

  function hydrateOnClient() {
    res.send(`<!doctype html>
      ${ReactDOM.renderToString(<Html assets={webpackIsomorphicTools.assets()} store={store} />)}`);
  }

  if (__DISABLE_SSR__) {
    hydrateOnClient();
    return;
  }

  match({
    history,
    routes: getRoutes(store),
    location: req.originalUrl,
  }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      error.name = 'RouterException';
      winston.error(error);
      res.status(500);
      hydrateOnClient();
    } else if (renderProps) {
      loadOnServer({ ...renderProps, store, helpers: providers }).then(() => {
        const component = (
          <Provider store={store} app={providers.app} restApp={providers.restApp} key="provider">
            <ReduxAsyncConnect {...renderProps} />
          </Provider>
        );

        res.status(200);

        global.navigator = { userAgent: req.headers['user-agent'] };

        res.send(`<!doctype html>
        ${ReactDOM.renderToString(
          <Html assets={webpackIsomorphicTools.assets()} component={component} store={store} />,
        )}`);
      }).catch((mountError) => {
        mountError.name = 'MountException';
        winston.error(mountError);
        res.status(500);
        hydrateOnClient();
      });
    } else {
      res.status(404).send('Not found');
    }
  });
});

if (config.port) {
  server.listen(config.port, (err) => {
    if (err) {
      err.name = 'StartupException';
      winston.error(err);
    }
    winston.info('==> 📡  App is running on port %s', config.port);
    winston.info('==> 🔗  Proxying api server on endpoint http://%s:%s/api/', config.host, config.port);
    winston.info('==> 💻  Open http://%s:%s in a browser to view the app.', config.host, config.port);
  });
} else {
  const err = new Error('No PORT environment variable has been specified');
  err.name = 'StartupException';
  winston.error(err);
}
