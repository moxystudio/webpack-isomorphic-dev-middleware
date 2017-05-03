'use strict';

const escapeHtml = require('lodash.escape');
const reporter = require('webpack-isomorphic-compiler').reporter;
const anser = require('anser');

function createHtmlDocument(message) {
    const body = anser.ansiToHtml(escapeHtml(message), { use_classes: true });  // eslint-disable-line camelcase

    // CSS styles based on https://github.com/glenjamin/webpack-hot-middleware/blob/master/client-overlay.js#L5 with some slight changes
    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>webpack-isomorphic-dev-middleware error</title>
        <style>
        body {
            background: #262626;
            color: #e6e6e6;
            line-height: 1.2;
            font-family: Menlo, Consolas, monospace;
            font-size: 13px;
            white-space: pre;
            margin: 10px;
        }

        .ansi-black-fg, .ansi-bright-black-fg { color: #6d7891; }
        .ansi-white-fg, .ansi-bright-white-fg { color: #fff; }
        .ansi-red-fg, .ansi-bright-red-fg { color: #e36049; }
        .ansi-green-fg, .ansi-bright-green-fg { color: #9eb567; }
        .ansi-yellow-fg, .ansi-bright-yellow-fg { color: #ffd080; }
        .ansi-blue-fg, .ansi-bright-blue-fg { color: #7cafc2; }
        .ansi-magenta-fg, .ansi-bright-magenta-fg { color: #d6add5; }
        .ansi-cyan-fg, .ansi-bright-cyan-fg { color: #c3c2ef; }

        [class$="-bg"] { padding: 2px 4px; border-radius: 2px; }
        .ansi-black-bg, .ansi-bright-black-bg { background-color: #6d7891; color: #fff; }
        .ansi-white-bg, .ansi-bright-white-bg { background-color: #fff; color: #464646; }
        .ansi-red-bg, .ansi-bright-red-bg { background-color: #e36049; color: #fff; }
        .ansi-green-bg, .ansi-bright-green-bg { background-color: #9eb567; color: #464646; }
        .ansi-yellow-bg, .ansi-bright-yellow-bg { background-color: #ffd080; }
        .ansi-blue-bg, .ansi-bright-blue-bg { background-color: #7cafc2; color: #fff; }
        .ansi-magenta-bg, .ansi-bright-magenta-bg { background-color: #d6add5; color: #464646; }
        .ansi-cyan-bg, .ansi-bright-cyan-bg { background-color: #c3c2ef; color: #464646; }

        .ansi-reverse { background-color: #fff; color: #464646; }
        .ansi-dim { opacity: 0.7; }
        .ansi-italic { font-style: italic; }
        .ansi-underline { text-decoration: underline; }
        </style>
    </head>
    <body>${body}</body>
</html>`;
}

// -----------------------------------------------------------

function renderErrorMiddleware(err, req, res, next) {  // eslint-disable-line no-unused-vars
    let message = reporter.renderError(err).trim();

    // Add detail into the message if defined
    // This is added to provide more information, e.g.: when failing to load the server file
    if (err.detail) {
        message += `\n\n${err.detail}`;
    }

    res
    .status(500)
    .send(createHtmlDocument(message));
}

module.exports = renderErrorMiddleware;
