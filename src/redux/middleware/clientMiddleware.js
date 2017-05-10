import * as logger from 'loglevel';

export default function clientMiddleware({ client, app, restApp }) {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }

    // eslint-disable-next-line no-redeclare
    const { promise, types, ...rest } = action;
    if (!promise) {
      return next(action);
    }

    const [REQUEST, SUCCESS, FAILURE] = types;
    next({ ...rest, type: REQUEST });

    const actionPromise = promise({ client, app, restApp }, dispatch);
    actionPromise.then(
      (result) => next({ ...rest, result, type: SUCCESS }),
      (error) => next({ ...rest, error, type: FAILURE }),
    ).catch((error) => {
      logger.error(error);
      next({ ...rest, error, type: FAILURE });
    });

    return actionPromise;
  };
}
