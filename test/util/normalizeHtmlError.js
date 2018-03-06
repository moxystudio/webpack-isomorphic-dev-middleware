'use strict';

const path = require('path');
const escapeRegExp = require('lodash.escaperegexp');

function normalizeHtmlError(html) {
    return html
    // Remove absolute directory references
    .replace(new RegExp(escapeRegExp(process.cwd() + path.sep), 'g'), '')
    // Remove stack traces done by pretty-error
    // <span class=\\"ansi-bright-black-fg\\">
    .replace(/<span class="ansi-bright-black-fg">[\s\S]+(The error above was thrown)/, '[stack]\n\n$1')
    // Remove config file from "Module parse failed: test/config/files/xxx.js Unexpected token (4:0)"
    // because some webpack versions include it, some not
    .replace(/\stest\/configs\/files\/[a-z0-9-]+\.js\s+/, ' ')
    // Normalize tmp directory
    .replace(/\btest[/\\]tmp\/[^/\\]+\//g, 'test/tmp/');
}

module.exports = normalizeHtmlError;
