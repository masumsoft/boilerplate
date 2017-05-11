const isEmpty = (value) => value === undefined || value === null || value === '';
// eslint-disable-next-line max-len
const join = (rules) => (value, data, params) => rules.map((rule) => rule(value, data, params)).filter((error) => !!error)[0];

export function email(value) {
  // Let's not start a debate on email regex. This is just for an example app!
  if (!isEmpty(value) && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
    return 'Invalid email address';
  }
  return null;
}

export function required(value) {
  if (isEmpty(value)) {
    return 'Required';
  }
  return null;
}

export function minLength(min) {
  return (value) => {
    if (!isEmpty(value) && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  };
}

export function maxLength(max) {
  return (value) => {
    if (!isEmpty(value) && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  };
}

export function integer(value) {
  if (!isEmpty(value) && !Number.isInteger(Number(value))) {
    return 'Must be an integer';
  }
  return null;
}

export function oneOf(enumeration) {
  return (value) => {
    if (enumeration.indexOf(value) === -1) {
      return `Must be one of: ${enumeration.join(', ')}`;
    }
    return null;
  };
}

export function match(field) {
  return (value, data) => {
    if (data) {
      if (value !== data[field]) {
        return 'Do not match';
      }
    }
    return null;
  };
}

export function createValidator(rules, params) {
  return (data = {}) => {
    const errors = {};
    Object.keys(rules).forEach((key) => {
      const rule = join([].concat(rules[key])); // concat enables both functions and arrays of functions
      const error = rule(data[key], data, { key, ...params });
      if (error) {
        errors[key] = error;
      }
    });
    return errors;
  };
}
