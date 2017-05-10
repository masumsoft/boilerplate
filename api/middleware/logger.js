export default function logger(app) {
  return (error, req, res, next) => {
    if (error && error.code !== 404) {
      error.name = 'APIException';
      app.error(error);
    }

    next(error);
  };
}
