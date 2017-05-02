'use strict';

const stripAnsi = require('strip-ansi');
const WritableStream = require('stream').Writable;
const escapeRegExp = require('lodash.escaperegexp');

function createOutputStream() {
    let output = '';
    const writableStream = new WritableStream();

    return Object.assign(writableStream, {
        _write(chunk, encoding, callback) {
            output += chunk.toString();
            callback();
        },

        getOutput() {
            return stripAnsi(output);
        },

        getReportOutput() {
            const str = output
            // Replace (xxxms) with (10ms)
            .replace(/\(\d+ms\)/g, '(10ms)')
            // Remove any file sizes
            .replace(/\d+\.\d+\skB/g, 'x.xx kB')
            // Remove absolute directory references
            .replace(new RegExp(escapeRegExp(process.cwd()), 'g'), '')
            // Normalize stack traces done by pretty-error
            .replace(new RegExp(`${escapeRegExp('    [0m')}.+`, 'g'), '    [stack]')
            .replace(/(\s{4}\[stack\])([\s\S]+\[stack\])*/, '$1');

            return stripAnsi(str);
        },
    });
}

module.exports = createOutputStream;
