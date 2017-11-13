'use strict';

const once = require('once');
const reporter = require('webpack-isomorphic-compiler').reporter;
const checkHumanErrors = require('./util/checkHumanErrors');
const compilationResolver = require('./util/compilationResolver');

function mainMiddleware(compiler, options) {
    // Only report human errors if reporting is enabled & humanErrors is set to true (default)
    const reporterOptions = options.report && reporter.getOptions(options.report);
    const checkHumanErrorsOnce = reporterOptions && reporterOptions.humanErrors && once(checkHumanErrors);
    const resolveCompilation = compilationResolver(compiler);

    return (req, res, next) => {
        // Wait for compilation to be ready
        resolveCompilation()
        .then((compilation) => {
            // Report human errors
            checkHumanErrorsOnce && checkHumanErrorsOnce(compiler, options, reporterOptions);

            res.locals.isomorphicCompilation = compilation;
        })
        .then(
            () => setImmediate(() => next()),
            (err) => setImmediate(() => next(err))
        );
    };
}

module.exports = mainMiddleware;
