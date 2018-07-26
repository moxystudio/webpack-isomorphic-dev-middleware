'use strict';

const path = require('path');
const pProps = require('p-props');
const requireFromString = require('require-from-string');

function getServerFile(webpackConfig, stats, options) {
    const statsJson = stats.toJson({
        publicPath: false,
        outputPath: false,
        performance: false,
        hash: false,
        timings: false,
        builtAt: false,
        chunks: false,
        chunkGroups: false,
        modules: false,
        children: false,
        assets: true,
        version: false,
    });

    const serverAsset = options.findServerAssetName(statsJson);

    /* istanbul ignore else */
    if (serverAsset) {
        return path.resolve(`${webpackConfig.output.path}/${serverAsset}`);
    }

    /* istanbul ignore next */
    throw new Error('Unable to get built server file');
}

function loadExports(compiler, options) {
    const { webpackConfig, webpackCompiler } = compiler.server;

    // Get the absolute path for the server file (bundle)
    const serverFile = getServerFile(webpackConfig, compiler.getCompilation().serverStats, options);

    // Read the file contents
    return new Promise((resolve, reject) => {
        webpackCompiler.outputFileSystem.readFile(serverFile, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString());
            }
        });
    })
    // Eval as a nodejs module
    .then((source) => requireFromString(source, serverFile))
    .catch((err) => {
        // Add extra info to the error
        err.detail = 'The error above was thrown while trying to load the built server file:\n';
        err.detail += path.relative('', serverFile);
        throw err;
    });
}

function compilationResolver(compiler, options) {
    let promise;

    return () => (
        // Wait for the stats
        compiler.resolve()
        // If the stats are the same, fulfill with a cached compilation
        // Otherwise, reload exports
        .then((compilation) => {
            if (promise && promise.compilation === compilation) {
                return promise;
            }

            promise = pProps({
                compilation,
                exports: loadExports(compiler, options),
            });
            promise.compilation = compilation;

            return promise;
        })
    );
}

module.exports = compilationResolver;
