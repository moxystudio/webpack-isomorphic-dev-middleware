'use strict';

const path = require('path');
const stripAnsi = require('strip-ansi');
const escapeRegExp = require('lodash.escaperegexp');

function normalizeReporterOutput(str) {
    str = str
    // Replace (xxxms) with (10ms)
    .replace(/\(\d+ms\)/g, '(10ms)')
    // Remove any file sizes
    .replace(/\d+\.\d+\skB/g, 'x.xx kB')
    // Remove stack traces done by pretty-error
    .replace(new RegExp(`${escapeRegExp('    [0m')}.+`, 'g'), '    [stack]')
    // Coalesce stack to only one entry
    .replace(/(\s{4}\[stack\])([\s\S]+\[stack\])*/, '$1')
    // Remove absolute directory references
    .replace(new RegExp(escapeRegExp(process.cwd() + path.sep), 'g'), '');

    str = stripAnsi(str);

    // Remove "Asset Size Chunks..." spacing between them
    str = str
    .replace(/Asset\s+Size\s+.+/g, (str) => str.replace(/\s+/g, ' '));

    return str;
}

function createWritter() {
    let output = '';

    function write(str) {
        output += str;
    }

    return Object.assign(write, {
        getOutput() {
            return stripAnsi(output);
        },

        getReportOutput() {
            return normalizeReporterOutput(output);
        },

        reset() {
            output = '';
        },
    });
}

module.exports = createWritter;
module.exports.normalizeReporterOutput = normalizeReporterOutput;
