'use strict';

const compose = require('compose-middleware').compose;
const webpackMiddleware = require('webpack-dev-middleware');
const standardFs = require('./util/standardFs');

function devMiddleware(compiler, options) {
    const { webpackCompiler, webpackConfig } = compiler.client;

    // We are going to pass a stubbed `webpack-dev-middleware` with run() and watch() and `plugin()` as no-ops,
    // This guarantees that 0 side-effects to the webpack compiler at instantiation, except for the
    // `outputFileSystem` which will be changed to in-memory
    const doneHandlers = [];
    const stubbedWebpackCompiler = new Proxy(webpackCompiler, {
        get(target, property) {
            if (property === 'run' || property === 'watch') {
                return () => {};
            }
            if (property === 'plugin') {
                return (name, handler) => {
                    if (name === 'done') {
                        doneHandlers.push(handler);
                    }
                };
            }

            return target[property];
        },
    });

    const devMiddleware = webpackMiddleware(stubbedWebpackCompiler, {
        quiet: true,  // We have our own reporter
        noInfo: true,
        watchOptions: options.watchOptions || undefined,  // Middleware doesn't like it being null so we cast it to undefined
        publicPath: webpackConfig.output.publicPath,  // Why doesn't webpack do this under the hood?!
        index: 'some-file-that-will-never-exist',
        headers: options.headers,
    });

    // Restore output filesystem if memory filesystem is disabled
    // See ./lib/util/checkHashes.js
    if (!options.memoryFs) {
        Object.assign(devMiddleware.fileSystem, standardFs);
        webpackCompiler.outputFileSystem = standardFs;
    }

    // Return final middleware
    return compose([
        // Call .compilerDone() so that the dev middleware get the new stats
        (req, res, next) => {
            doneHandlers.forEach((handler) => handler(compiler.getStats().client));
            next();
        },
        devMiddleware,
    ]);
}

module.exports = devMiddleware;
