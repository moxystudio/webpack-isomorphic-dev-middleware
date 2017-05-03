'use strict';

const path = require('path');
const pProps = require('p-props');
const nodeEval = require('node-eval');

function getServerFile(webpackConfig, stats) {
    const statsJson = stats.toJson({
        chunks: false,
        modules: false,
        children: false,
        assets: false,
        version: false,
    });

    for (const key in statsJson.entrypoints) {
        return path.resolve(`${webpackConfig.output.path}/${statsJson.entrypoints[key].assets[0]}`);
    }

    /* istanbul ignore next */
    throw new Error('Unable to get built server file');
}

function loadExports(compiler) {
    const { webpackConfig, webpackCompiler } = compiler.server;

    // Get the absolute path for the server file (bundle)
    const serverFile = getServerFile(webpackConfig, compiler.getStats().server);

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
    .then((source) => nodeEval(source, serverFile))
    .catch((err) => {
        // Add extra info to the error
        err.detail = 'The error above was thrown while trying to load the built server file:\n';
        err.detail += path.relative('', serverFile);
        throw err;
    });
}

// -----------------------------------------------------------

function compilationResolver(compiler) {
    let compilation;

    return () => (
        // Wait for the stats
        compiler.resolve()
        // If the stats are the same, fulfill with a cached compilation
        // Otherwise, reload exports
        .then((stats) => {
            if (compilation && compilation.stats === stats) {
                return compilation;
            }

            return pProps({
                stats,
                exports: loadExports(compiler),
            })
            .then((compilation_) => (compilation = compilation_));
        })
        .then(() => compilation)
    );
}

module.exports = compilationResolver;
