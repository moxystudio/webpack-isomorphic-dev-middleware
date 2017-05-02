'use strict';

const path = require('path');

module.exports = {
    entry: path.resolve(`${__dirname}/files/simple.js`),
    output: {
        path: path.resolve(`${__dirname}/../tmp`),
        filename: 'client.js',
    },
};
