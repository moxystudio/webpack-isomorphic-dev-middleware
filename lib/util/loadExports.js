'use strict';

const path = require('path');

// TODO: compile in memory

function getServerFile(webpackConfig, stats) {
    const statsJson = stats.toJson({
        chunks: false,
        modules: false,
        children: false,
        assets: false,
        version: false,
    });

    for (const key in statsJson.entrypoints) {
        return `${webpackConfig.output.path}/${statsJson.entrypoints[key].assets[0]}`;
    }

    throw new Error('Unable to get built server file');
}

// -----------------------------------------------------------

function loadExports(compiler) {
    const { webpackConfig } = compiler.server;

    // Get the stuff exported by the server file by requiring it
    const serverFile = getServerFile(webpackConfig, compiler.getStats().server);

    // Delete from the require cache
    delete require.cache[serverFile];

    try {
        return require(serverFile);  // eslint-disable-line global-require
    } catch (err) {
        // Add extra info to the error
        err.detail = 'The error above occured while trying to require the built server file:\n';
        err.detail += path.relative('', serverFile);
        throw err;
    }
}

module.exports = loadExports;
