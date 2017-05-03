'use strict';

const once = require('once');
const pProps = require('p-props');
const reporter = require('webpack-isomorphic-compiler').reporter;
const loadExports = require('./util/loadExports');
const checkHumanErrors = require('./util/checkHumanErrors');
const resolveCompilation = require('./util/resolveCompilation');

function mainMiddleware(compiler, options) {
    // Only report human errors if reporting is enabled & humanErrors is set to true (default)
    const reporterOptions = options.watchOptions && options.watchOptions.report && reporter.getOptions(options.watchOptions.report);
    const checkHumanErrorsOnce = reporterOptions && reporterOptions.humanErrors && once(checkHumanErrors);

    return (req, res, next) => {
        // Wait for compilation to be ready
        Promise.resolve(resolveCompilation(compiler))
        // Build the `isomorphicCompilation` object
        .then((stats) => pProps({
            stats,
            exports: loadExports(compiler),
        }))
        // Finalize
        .then((isomorphicCompilation) => {
            checkHumanErrorsOnce && checkHumanErrorsOnce(compiler, options, reporterOptions);

            res.locals.isomorphicCompilation = isomorphicCompilation;
        })
        .then(
            () => setImmediate(() => next()),
            (err) => setImmediate(() => next(err))
        );
    };
}

module.exports = mainMiddleware;
