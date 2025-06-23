// /packages/vscode-extension/webpack.config.js
'use strict';
const path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node',
  entry: './src/extension.ts', // Chemin relatif au package
  output: {
    path: path.resolve(__dirname, 'dist'), // Chemin relatif au package
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // L'alias est maintenant géré par tsconfig.json, on le supprime ici
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          // Important pour dire à ts-loader d'utiliser le bon tsconfig
          options: {
            configFile: 'tsconfig.json'
          }
        }],
      },
    ],
  },
  devtool: 'source-map',
};
module.exports = config;