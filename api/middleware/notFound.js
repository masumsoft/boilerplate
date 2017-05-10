const errors = require('feathers-errors');

export default function notFoundHandler() {
  return (req, res, next) => {
    next(new errors.NotFound('The content you are looking for was not found'));
  };
}
