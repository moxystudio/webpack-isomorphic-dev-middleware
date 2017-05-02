'use strict';

const escapeHtml = require('lodash.escape');
const reporter = require('webpack-isomorphic-compiler').reporter;
const stripAnsi = require('strip-ansi');

function createHtmlDocument(message) {
    const body = escapeHtml(message);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>webpack-isomorphic-dev-middleware error</title>
</head>
<body>
<pre>${body}</pre>
</body>
</html>`;
}

// -----------------------------------------------------------

function renderErrorMiddleware(err, req, res, next) {  // eslint-disable-line no-unused-vars
    let message = stripAnsi(reporter.renderError(err));

    // Add detail into the message if defined
    // This is added to provide more information, e.g.: when failing to load the server bundle
    if (err.detail) {
        message += `\n${err.detail}\n`;
    }

    res
    .status(500)
    .send(createHtmlDocument(message));
}

module.exports = renderErrorMiddleware;
