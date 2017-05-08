'use strict';

const compose = require('compose-middleware').compose;
const webpackMiddleware = require('webpack-dev-middleware');

function devMiddleware(compiler, options) {
    const { webpackCompiler, webpackConfig } = compiler.client;

    // We are going to pass a stubbed `webpack-dev-middleware` with run(), watch(), plugin()
    // and outputFileSystem´ assignment as no-ops
    // This guarantees that it interoperates well with our own middleware
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
        set(target, property, value) {
            /* istanbul ignore if */
            if (property !== 'outputFileSystem') {
                target[property] = value;
            }

            return true;
        },
    });

    // Create the middleware
    const devMiddleware = webpackMiddleware(stubbedWebpackCompiler, {
        quiet: true,  // We have our own reporter
        noInfo: true,
        watchOptions: options.watchOptions || undefined,  // Middleware doesn't like it being null so we cast it to undefined
        publicPath: webpackConfig.output.publicPath,  // Why doesn't webpack do this under the hood?!
        index: 'some-file-that-will-never-exist',
        headers: options.headers,
    });

    // Make sure webpack-dev-middleware is using our own compiler `outputFileSystem`
    for (const key in webpackCompiler.outputFileSystem) {
        if (typeof webpackCompiler.outputFileSystem[key] === 'function') {
            devMiddleware.fileSystem[key] = webpackCompiler.outputFileSystem[key].bind(webpackCompiler.outputFileSystem);
        }
    }

    // Return final middleware
    return compose([
        // Call done callbacks so that the dev middleware get the new stats
        (req, res, next) => {
            doneHandlers.forEach((handler) => handler(compiler.getStats().client));
            next();
        },
        devMiddleware,
    ]);
}

module.exports = devMiddleware;
