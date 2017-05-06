'use strict';

const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const compose = require('compose-middleware').compose;
const mergeOptions = require('merge-options');
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
    options = mergeOptions({
        memoryFs: true,  // Enable memory fs
        report: { stats: 'once' },  // Enable reporting, see https://github.com/moxystudio/webpack-isomorphic-compiler/blob/master/README.md#reporter

        watchOptions: {},  // Options to pass to .watch()
        headers: null,  // Headers to set when serving compiled files, see https://github.com/webpack/webpack-dev-middleware
    }, options);

    Object.assign(options.watchOptions, { report: options.report });

    return options;
}

// -----------------------------------------------------------

function middleware(...args) {
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

    // Start watching
    options.watchOptions !== false && compiler.watch(options.watchOptions);

    // Expose isomorphic compiler
    middleware.isomorphicCompiler = compiler;

    return middleware;
}

module.exports = middleware;
