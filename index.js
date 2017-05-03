'use strict';

const compose = require('compose-middleware').compose;
const merge = require('lodash.merge');
const standardFs = require('./lib/fs/standardFs');
const memoryFs = require('./lib/fs/memoryFs');
const mainMiddleware = require('./lib/mainMiddleware');
const devMiddleware = require('./lib/devMiddleware');
const renderErrorMiddleware = require('./lib/renderErrorMiddleware');

function middleware(compiler, options) {
    options = merge({
        memoryFs: true,  // Enable memory fs
        watchOptions: { report: { stats: 'once' } },  // Options to pass to .watch()
        headers: null,  // Headers to set when serving compiled files, see https://github.com/webpack/webpack-dev-middleware
    }, options);

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

    return middleware;
}

module.exports = middleware;
