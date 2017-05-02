'use strict';

const path = require('path');
const escapeRegExp = require('lodash.escaperegexp');

function normalizeHtmlError(html) {
    return html
    // Remove absolute directory references
    .replace(new RegExp(escapeRegExp(process.cwd() + path.sep), 'g'), '')
    // Remove stack traces done by pretty-error
    .replace(/- [\s\S]+(The error above was thrown)/, '[stack]\n\n$1')
    // Normalize tmp directory
    .replace(/\btest[/\\]tmp\/[^/\\]+\//g, 'test/tmp/');
}

module.exports = normalizeHtmlError;
