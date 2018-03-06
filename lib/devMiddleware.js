'use strict';

const compose = require('compose-middleware').compose;
const webpackMiddleware = require('webpack-dev-middleware');

function createStubbedWebpackCompiler(webpackCompiler) {
    // Make `run` and `watch` no-ops
    // Additionally, we don't want the dev-middleware to be notified of anything, except for the `done` hook
    const doneHandlers = [];

    const stubbedWebpackCompilerHooks = new Proxy({}, {
        get(target, property) {
            if (property === 'done') {
                return {
                    tap: (name, handler) => doneHandlers.push(handler),
                };
            }

            return {
                tap: () => {},
            };
        },
        set() {
            /* istanbul ignore next */
            return true;
        },
    });

    const stubbedWebpackCompiler = new Proxy(webpackCompiler, {
        get(target, property) {
            if (property === 'run' || property === 'watch') {
                return () => {};
            }

            // The plugin API is for webpack <= v3
            /* istanbul ignore if */
            if (property === 'plugin') {
                return (name, handler) => {
                    if (name === 'done') {
                        doneHandlers.push(handler);
                    }
                };
            }

            // The hooks API is for webpack >= v4
            if (property === 'hooks') {
                return stubbedWebpackCompilerHooks;
            }

            return target[property];
        },
        set() {
            // Do not modify any property of the compiler, specially the `outputFileSystem`
            return true;
        },
    });

    return {
        stubbedWebpackCompiler,
        notifyDone: (stats) => doneHandlers.forEach((handler) => handler(stats)),
    };
}

function devMiddleware(compiler, options) {
    const { webpackCompiler, webpackConfig } = compiler.client;

    // We are going to pass a stubbed `webpack-dev-middleware`
    // This guarantees that it interoperates well with our own middleware
    const { stubbedWebpackCompiler, notifyDone } = createStubbedWebpackCompiler(webpackCompiler);

    // Create the middleware
    const devMiddleware = webpackMiddleware(stubbedWebpackCompiler, {
        logLevel: 'silent', // We have our own reporter
        watchOptions: undefined, // It's not this middleware that calls `.watch()`
        publicPath: webpackConfig.output.publicPath, // Why doesn't webpack do this under the hood?!
        index: 'some-file-that-will-never-exist',
        headers: options.headers,
    });

    // Make sure webpack-dev-middleware is using our own compiler `outputFileSystem`
    if (webpackCompiler.outputFileSystem !== devMiddleware.fileSystem) {
        for (const key in webpackCompiler.outputFileSystem) {
            if (typeof webpackCompiler.outputFileSystem[key] === 'function') {
                devMiddleware.fileSystem[key] = webpackCompiler.outputFileSystem[key].bind(webpackCompiler.outputFileSystem);
            }
        }
    }

    // Return final middleware
    return compose([
        // Call done callbacks so that the dev middleware get the new stats
        (req, res, next) => {
            const { clientStats } = res.locals.isomorphic.compilation;

            notifyDone(clientStats);
            next();
        },
        devMiddleware,
    ]);
}

module.exports = devMiddleware;
