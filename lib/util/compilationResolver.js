'use strict';

const path = require('path');
const pProps = require('p-props');
const requireFromString = require('require-from-string');

function getServerFile(webpackConfig, stats) {
    const statsJson = stats.toJson({
        chunks: false,
        modules: false,
        children: false,
        assets: false,
        version: false,
    });

    const serverEntrypoint = statsJson.entrypoints[Object.keys(statsJson.entrypoints)[0]];
    const serverAsset = serverEntrypoint && serverEntrypoint.assets.find((asset) => /\.js$/.test(asset));

    if (serverAsset) {
        return path.resolve(`${webpackConfig.output.path}/${serverAsset}`);
    }

    /* istanbul ignore next */
    throw new Error('Unable to get built server file');
}

function loadExports(compiler) {
    const { webpackConfig, webpackCompiler } = compiler.server;

    // Get the absolute path for the server file (bundle)
    const serverFile = getServerFile(webpackConfig, compiler.getCompilation().serverStats);

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

function compilationResolver(compiler) {
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
                exports: loadExports(compiler),
            });
            promise.compilation = compilation;

            return promise;
        })
    );
}

module.exports = compilationResolver;
