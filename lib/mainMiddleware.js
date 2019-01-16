'use strict';

const compilationResolver = require('./util/compilationResolver');

function mainMiddleware(compiler, options) {
    const resolveCompilation = compilationResolver(compiler, options);

    return (req, res, next) => {
        // Wait for compilation to be ready
        resolveCompilation()
        .then((compilation) => {
            // If we're not in an express environment, `res.locals` needs to be defined
            if (!res.locals) {
                res.locals = {};
            }
            res.locals.isomorphic = compilation;
        })
        // There's no need to use `setImmediate` when calling `next` because express already
        // defers the call for us
        .then(next, next);
    };
}

module.exports = mainMiddleware;
