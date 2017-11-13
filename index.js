'use strict';

const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const webpackIsomorphicCompilerNotifier = require('webpack-isomorphic-compiler-notifier');
const compose = require('compose-middleware').compose;
const merge = require('lodash.merge');
const standardFs = require('./lib/fs/standardFs');
const memoryFs = require('./lib/fs/memoryFs');
const mainMiddleware = require('./lib/mainMiddleware');
const devMiddleware = require('./lib/devMiddleware');
const renderErrorMiddleware = require('./lib/renderErrorMiddleware');

function parseArgs(args) {
    const [firstArg = {}, secondArg, thirdArg] = args;

    // Webpack multi compiler?
    if (firstArg.compilers && firstArg.run) {
        return {
            compiler: webpackIsomorphicCompiler(firstArg.compilers[0], firstArg.compilers[1]),
            options: parseOptions(secondArg),
        };
    }

    // Isomorphic compiler?
    if (firstArg.resolve && firstArg.client) {
        return {
            compiler: firstArg,
            options: parseOptions(secondArg),
        };
    }

    // Seperate webpack compilers
    if (firstArg.run && secondArg && secondArg.run) {
        return {
            compiler: webpackIsomorphicCompiler(firstArg, secondArg),
            options: parseOptions(thirdArg),
        };
    }

    throw new TypeError('Invalid arguments passed to middleware');
}

function parseOptions(options) {
    options = merge({
        memoryFs: true,  // Enable memory fs
        watchOptions: {},  // Options to pass to .watch()
        report: { stats: 'once' },  // Enable reporting, see https://github.com/moxystudio/webpack-isomorphic-compiler/blob/master/README.md#reporter
        notify: false,  // Enable OS notifications, see https://github.com/moxystudio/webpack-isomorphic-compiler-notifier
        headers: null,  // Headers to set when serving compiled files, see https://github.com/webpack/webpack-dev-middleware
    }, options);

    // Normalize some options
    options.watchOptions = options.watchOptions === true ? {} : options.watchOptions;
    options.report = options.report === true ? {} : options.report;
    options.notify = options.notify === true ? {} : options.notify;

    return options;
}

// -----------------------------------------------------------

function webpackIsomorphicDevMiddleware(...args) {
    const { compiler, options } = parseArgs(args);

    // Set output filesystems
    const fs = options.memoryFs ? memoryFs() : standardFs();

    compiler.client.webpackCompiler.outputFileSystem = fs;
    compiler.server.webpackCompiler.outputFileSystem = fs;

    // Create middleware by composing our parts
    const middleware = compose([
        mainMiddleware(compiler, options),
        devMiddleware(compiler, options),
        renderErrorMiddleware,
    ]);

    // Enable reporting
    options.report !== false && webpackIsomorphicCompiler.reporter(compiler, options.report);

    // Notify build status through OS notifications
    options.notify !== false && webpackIsomorphicCompilerNotifier(compiler, options.notify);

    // Start watching
    options.watchOptions !== false && compiler.watch(options.watchOptions);

    // Expose isomorphic compiler
    middleware.isomorphicCompiler = compiler;

    return middleware;
}

module.exports = webpackIsomorphicDevMiddleware;
