// /apps/vscode-extension/webpack.config.js
'use strict';
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/** @type {import('webpack').Configuration} */
const config = {
    target: 'node',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
    },
    externals: {
        vscode: 'commonjs vscode',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            // Ces alias disent à Webpack où trouver les sources de nos packages internes.
            '@jabbarroot/core': path.resolve(__dirname, '../../packages/core/src'),
            '@jabbarroot/types': path.resolve(__dirname, '../../packages/types/src'),
            '@jabbarroot/prompt-factory': path.resolve(__dirname, '../../packages/prompt-factory/src'),
            // Ajoute ici d'autres packages internes si l'extension en dépend
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ 
                    loader: 'ts-loader',
                    // On peut ajouter une option pour s'assurer qu'il gère bien les alias
                    options: {
                        transpileOnly: true // Accélère la compilation, tsc s'occupe du type-checking
                    }
                }]
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: require.resolve('tiktoken/tiktoken_bg.wasm'),
                    to: '.',
                },
            ],
        }),
    ],
    // devtool: 'source-map',
    devtool: 'inline-source-map',
    optimization: {
        minimize: false // PAS de minification par Webpack sur le bundle de l'extension
      },
    node: {
        __dirname: false, // Important pour que __dirname fonctionne comme attendu dans une extension
        __filename: false, // Important pour que __filename fonctionne comme attendu
    },

};

module.exports = config;