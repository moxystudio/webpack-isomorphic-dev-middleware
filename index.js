'use strict';

const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const startReporting = require('webpack-isomorphic-compiler-reporter');
const startNotifying = require('webpack-sane-compiler-notifier');
const compose = require('compose-middleware').compose;
const merge = require('lodash.merge');
const memoryFs = require('./lib/util/memoryFs');
const mainMiddleware = require('./lib/mainMiddleware');
const devMiddleware = require('./lib/devMiddleware');
const renderErrorMiddleware = require('./lib/renderErrorMiddleware');
const checkHumanErrors = require('./lib/util/checkHumanErrors');

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

    // Separate webpack compilers
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
        watchDelay: 0,
        report: { stats: 'once' },  // Enable reporting, see https://github.com/moxystudio/webpack-isomorphic-compiler-reporter
        notify: false,  // Enable OS notifications, see https://github.com/moxystudio/webpack-sane-compiler-notifier
        headers: null,  // Headers to set when serving compiled files, see https://github.com/webpack/webpack-dev-middleware
    }, options);

    // Normalize some options
    options.report = options.report === true ? {} : options.report;
    options.notify = options.notify === true ? {} : options.notify;

    return options;
}

// -----------------------------------------------------------

function webpackIsomorphicDevMiddleware(...args) {
    const { compiler, options } = parseArgs(args);

    // Use an in-memory filesystem
    if (options.memoryFs) {
        const fs = memoryFs();

        compiler.client.webpackCompiler.outputFileSystem = fs;
        compiler.server.webpackCompiler.outputFileSystem = fs;
    }

    // Enable reporting
    if (options.report !== false) {
        options.report = startReporting(compiler, options.report).options;
        options.report.humanErrors && compiler.once('end', (compilation) => checkHumanErrors(compilation, options));
    }

    // Notify build status through OS notifications
    if (options.notify !== false) {
        options.notify = startNotifying(compiler, options.notify).options;
    }

    // Create middleware by composing our parts
    const middleware = compose([
        mainMiddleware(compiler, options),
        devMiddleware(compiler, options),
        renderErrorMiddleware(compiler, options),
    ]);

    // Expose isomorphic compiler
    middleware.compiler = compiler;

    // Start watching
    setTimeout(() => compiler.watch(options.watchOptions), options.watchDelay);

    return middleware;
}

module.exports = webpackIsomorphicDevMiddleware;
