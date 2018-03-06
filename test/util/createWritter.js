'use strict';

const path = require('path');
const stripAnsi = require('strip-ansi');
const escapeRegExp = require('lodash.escaperegexp');

function normalizeReporterOutput(str) {
    return stripAnsi(str)
    // Replace (100ms) with (xxxms)
    .replace(/\(\d+ms\)/g, '(xxx)')
    // Remove "Asset Size Chunks..." spacing between them
    .replace(/Asset\s+Size\s+.+/g, (str) => str.replace(/\s+/g, ' '))
    // Remove asset lines with something standard
    .replace(/(\s+[a-z0-9.]+\.[a-z]+\s)\s*(?:\d+\.\d+)\s(?:bytes|ki?b|mi?b|gi?b)\s.+?\n/gi, '$1 xxx\n')
    // Remove stack traces done by pretty-error
    .replace(new RegExp(`${escapeRegExp('    [0m')}.+`, 'g'), '    [stack]')
    // Coalesce stack to only one entry
    .replace(/(\s{4}\[stack\])([\s\S]+\[stack\])*/, '$1')
    // Remove absolute directory references
    .replace(new RegExp(escapeRegExp(process.cwd() + path.sep), 'g'), '');
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
