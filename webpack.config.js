const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  devtool: "source-map",
  entry: './scripts/module.js',
  optimization: {
    // change minimize to false, we are shipping a map file as well so people
    // viewing in chrome dev console will see and uncompressed version of the file for debugging
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

