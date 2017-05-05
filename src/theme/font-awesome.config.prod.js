const buildExtractStylesLoader = require('./buildExtractStylesLoader');
const fontAwesomeConfig = require('./font-awesome.config.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
fontAwesomeConfig.styleLoader = buildExtractStylesLoader(ExtractTextPlugin.extract({
  fallback: 'style-loader',
  use: [
    {
      loader: 'css-loader',
      query: {
        modules: true,
        importLoaders: 3,
        sourceMap: true
      }
    }, {
      loader: 'less-loader',
      query: {
        outputStyle: 'expanded',
        sourceMap: true,
        sourceMapContents: true
      }
    }
  ]
}));
module.exports = fontAwesomeConfig;
