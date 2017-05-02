'use strict';

const pDefer = require('p-defer');

function resolveSync(compiler) {
    const error = compiler.getError();

    if (error) {
        return Promise.reject(error);
    }

    return compiler.getStats();
}

function resolveAsync(compiler) {
    const deferred = pDefer();

    function cleanup() {
        compiler.removeListener('error', onDone);
        compiler.removeListener('end', onDone);
    }

    function onDone() {
        cleanup();
        deferred.resolve(resolveSync(compiler));
    }

    compiler
    .on('error', onDone)
    .on('end', onDone);

    return deferred.promise;
}

// -----------------------------------------------------------

function resolveCompilation(compiler) {
    return Promise.resolve(resolveSync(compiler) || resolveAsync(compiler));
}

module.exports = resolveCompilation;
