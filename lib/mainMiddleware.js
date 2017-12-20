'use strict';

const compilationResolver = require('./util/compilationResolver');

function mainMiddleware(compiler) {
    const resolveCompilation = compilationResolver(compiler);

    return (req, res, next) => {
        // Wait for compilation to be ready
        resolveCompilation()
        .then((compilation) => {
            res.locals.isomorphic = compilation;
        })
        // There's no need to use `setImmediate` when calling `next` because express already
        // defers the call for us
        .then(next, next);
    };
}

module.exports = mainMiddleware;
