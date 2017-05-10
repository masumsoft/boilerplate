import { cloneDeep } from 'lodash';

export default function errorLogger(app) {
  return (error, req, res, next) => {
    if (error && error.code >= 500) {
      const logError = cloneDeep(error);
      delete logError.hook;
      app.error(logError);
    }

    next(error);
  };
}
