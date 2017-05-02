'use strict';

const path = require('path');

module.exports = {
    entry: path.resolve(`${__dirname}/files/syntax-error.js`),
    output: {
        path: path.resolve(`${__dirname}/../tmp`),
        filename: 'server.js',
    },
};
