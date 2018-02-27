'use strict';

const path = require('path');

module.exports = {
    entry: path.resolve(`${__dirname}/files/exports-render.js`),
    target: 'node',
    output: {
        path: path.resolve(`${__dirname}/../tmp`),
        filename: 'output.a1aaaaaaaaaaaaaaaaaaaaaaa.js', // Simulate hashes,
        libraryTarget: 'this',
    },
};
