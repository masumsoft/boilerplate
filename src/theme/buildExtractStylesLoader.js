<<<<<<< HEAD
/**
 * @summary: The encoder function is capable to apply either incoming strings from webpack modules or objects.
 * @param loader
 * @returns {string}
 */
=======
>>>>>>> react, babel & webpack module updates
function encodeLoader(loader) {
  if (typeof loader === 'string') {
    return loader;
  }

  if (typeof loader.options !== 'undefined') {
    const query = Object
      .keys(loader.options)
<<<<<<< HEAD
      .map(param => `${encodeURIComponent(param)}=${encodeURIComponent(loader.options[param])}`)
=======
      .map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loader.options[param])}`)
>>>>>>> react, babel & webpack module updates
      .join('&');
    return `${loader.loader}?${query}`;
  }
  return loader.loader;
}

<<<<<<< HEAD
/**
 * buildExtractStylesLoader can also deal with options without any trouble as
 * it converts them to query parameters if needed.
 */
=======
>>>>>>> react, babel & webpack module updates
module.exports = function buildExtractStylesLoader(loaders) {
  const extractTextLoader = encodeLoader(loaders[0]);
  const fallbackLoader = encodeLoader(loaders[1]);

  const restLoaders = loaders
    .slice(2)
<<<<<<< HEAD
    .map(loader => {
=======
    .map((loader) => {
>>>>>>> react, babel & webpack module updates
      if (typeof loader === 'string') {
        return loader;
      }
      return encodeLoader(loader);
    });

  return [
    extractTextLoader,
<<<<<<< HEAD
    fallbackLoader
  ].concat(restLoaders).join('!');
=======
    fallbackLoader,
    ...restLoaders,
  ].join('!');
>>>>>>> react, babel & webpack module updates
};
