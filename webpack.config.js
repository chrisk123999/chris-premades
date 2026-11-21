const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    entry: './scripts/module.mjs',
    optimization: {
    // change minimize to false, we are shipping a map file as well so people
    // viewing in chrome dev console will see and uncompressed version of the file for debugging
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({Sequence: [path.resolve(__dirname, 'scripts/macros/animations/sequence.mjs'), 'default']})
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    }
};

