'use strict';

const once = require('once');
const checkHumanErrors = require('./util/checkHumanErrors');
const compilationResolver = require('./util/compilationResolver');

function mainMiddleware(compiler, options) {
    // Only report human errors if reporting is enabled & humanErrors is set to true (default)
    const shouldCheckHumanErrors = !!(options.report && options.report.humanErrors);
    const checkHumanErrorsOnce = shouldCheckHumanErrors && once(checkHumanErrors);
    const resolveCompilation = compilationResolver(compiler);

    return (req, res, next) => {
        // Wait for compilation to be ready
        resolveCompilation()
        .then((compilation) => {
            // Report human errors
            checkHumanErrorsOnce && checkHumanErrorsOnce(compilation, options);

            res.locals.isomorphic = compilation;
        })
        // There's no need to use `setImmediate` when calling `next` because express already
        // defers the call for us
        .then(next, next);
    };
}

module.exports = mainMiddleware;
