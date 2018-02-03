'use strict';

const path = require('path');
const pify = require('pify');
const pFinally = require('p-finally');
const rimraf = pify(require('rimraf'));
const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');

const tmpDir = path.resolve(`${__dirname}/../tmp`);
const compilers = [];

function createCompiler(clientWebpackConfig, serverWebpackConfig) {
    const configs = uniquifyConfigs({ client: clientWebpackConfig, server: serverWebpackConfig });
    const compiler = webpackIsomorphicCompiler(configs.client, configs.server);

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

function uniquifyConfigs({ client: clientWebpackConfig, server: serverWebpackConfig }) {
    if (clientWebpackConfig.output.path.indexOf(tmpDir) !== 0) {
        throw new Error(`Client \`webpackConfig.output.path\` must start with ${tmpDir}`);
    }
    if (serverWebpackConfig.output.path.indexOf(tmpDir) !== 0) {
        throw new Error(`Server \`webpackConfig.output.path\` must start with ${tmpDir}`);
    }

    const uid = `${Math.round(Math.random() * 100000000000).toString(36)}-${Date.now().toString(36)}`;

    clientWebpackConfig = Object.assign({}, clientWebpackConfig);
    clientWebpackConfig.output = Object.assign({}, clientWebpackConfig.output);
    clientWebpackConfig.output.path = clientWebpackConfig.output.path.replace(tmpDir, path.join(tmpDir, uid));

    serverWebpackConfig = Object.assign({}, serverWebpackConfig);
    serverWebpackConfig.output = Object.assign({}, serverWebpackConfig.output);
    serverWebpackConfig.output.path = serverWebpackConfig.output.path.replace(tmpDir, path.join(tmpDir, uid));

    return {
        client: clientWebpackConfig,
        server: serverWebpackConfig,
    };
}

function push(compiler) {
    compilers.push(compiler);
}

module.exports = createCompiler;
module.exports.teardown = teardown;
module.exports.uniquifyConfigs = uniquifyConfigs;
module.exports.push = push;
