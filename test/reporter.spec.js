'use strict';

const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const createWritter = require('./util/createWritter');
const touchFile = require('./util/touchFile');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');

afterEach(() => jest.restoreAllMocks());
afterEach(() => createCompiler.teardown());

it('should report stats only once by default', async () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);
    const writter = createWritter();

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: { write: writter },
    }));

    await request(app)
    .get('/client.js')
    .expect(200);

    await new Promise((resolve) => {
        compiler.once('begin', resolve);
        // Need to add a little delay otherwise webpack won't pick it up..
        // This happens because the file is being written while chokidar is not yet ready (`ready` event not yet emitted)
        setTimeout(() => touchFile(configServerBasic.entry), 200);
    });

    await request(app)
    .get('/client.js')
    .expect(200);

    expect(writter.getReportOutput()).toMatchSnapshot();
});

it('should not report anything if options.report is false', async () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);

    jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    await request(app)
    .get('/client.js')
    .expect(200);

    expect(process.stderr.write).toHaveBeenCalledTimes(0);
});
