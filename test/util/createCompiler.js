'use strict';

const path = require('path');
const pify = require('pify');
const pFinally = require('p-finally');
const rimraf = pify(require('rimraf'));
const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');

const tmpDir = path.resolve(`${__dirname}/../tmp`);
const compilers = [];

function replaceOutputPath(webpackConfig) {
    if (webpackConfig.output.path.indexOf(tmpDir) !== 0) {
        throw new Error(`\`webpackConfig.output.path\` must start with ${tmpDir}`);
    }

    const uid = `${Math.round(Math.random() * 100000000000).toString(36)}-${Date.now().toString(36)}`;

    webpackConfig = Object.assign({}, webpackConfig);
    webpackConfig.output = Object.assign({}, webpackConfig.output);
    webpackConfig.output.path = webpackConfig.output.path.replace(tmpDir, path.join(tmpDir, uid));

    return webpackConfig;
}

// -----------------------------------------------------------

function createCompiler(clientWebpackConfig, serverWebpackConfig) {
    clientWebpackConfig = replaceOutputPath(clientWebpackConfig);
    serverWebpackConfig = replaceOutputPath(serverWebpackConfig);

    const compiler = webpackIsomorphicCompiler(clientWebpackConfig, serverWebpackConfig);

    compilers.push(compiler);

    return compiler;
}

function teardown() {
    const promises = compilers.map((compiler) => {
        // Clear all listeners
        compiler
        .removeAllListeners()
        .on('error', () => {});

        return pFinally(
            // Unwatch
            compiler.unwatch()
            // Wait for compilation.. just in case..
            .then(() => {
                if (!compiler.isCompiling()) {
                    return;
                }

                return new Promise((resolve) => {
                    compiler
                    .on('end', () => resolve())
                    .on('error', () => resolve());
                });
            }),
            // Remove output dirs
            () => Promise.all([
                rimraf(compiler.client.webpackConfig.output.path),
                rimraf(compiler.server.webpackConfig.output.path),
            ])
        );
    });

    return Promise.all(promises);
}

module.exports = createCompiler;
module.exports.teardown = teardown;
