'use strict';

const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const createCompilation = require('./util/createCompilation');
const createWritter = require('./util/createWritter');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');
const configServerWithHashes = require('./configs/server-with-hashes');

afterEach(() => jest.restoreAllMocks());
afterEach(() => createCompiler.teardown());

it('should warn if hashes are being used in webpack config', async () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerWithHashes);
    const writter = createWritter();

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: { write: writter },
    }));

    await request(app)
    .get('/client.js')
    .expect(200);

    expect(writter.getReportOutput()).toMatchSnapshot();
});

it('should warn if hashes are being used in webpack config (rebuild)', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);
    const writter = createWritter();

    compiler.watch = () => {};

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: { write: writter },
    }));

    compiler.emit('begin');
    compiler.emit('end', createCompilation());
    compiler.emit('begin');
    compiler.emit('end', createCompilation({
        clientStats: {
            toJson: () => ({
                assets: [{ name: 'foo.a1aaaaaaaaaaaaaaaaaaaaaaa.js' }],
            }),
        },
    }));
    compiler.emit('begin');
    compiler.emit('end', createCompilation({
        clientStats: {
            toJson: () => ({
                assets: [{ name: 'foo.a2aaaaaaaaaaaaaaaaaaaaaaa.js' }],
            }),
        },
    }));

    expect(writter.getReportOutput()).toMatchSnapshot();
});

it('should not warn about hashes are being used in webpack config if options.memoryFs is false', async () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerWithHashes);
    const writter = createWritter();

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        memoryFs: false,
        report: { write: writter },
    }));

    await request(app)
    .get('/client.js')
    .expect(200);

    expect(writter.getReportOutput()).toMatchSnapshot();
});

it('should fallback to `process.stderr.write` when printing the warnings', async () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerWithHashes);

    jest.spyOn(process.stderr, 'write');
    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    await request(app)
    .get('/client.js')
    .expect(200);

    expect(process.stderr.write).toHaveBeenCalledTimes(1);
    expect(process.stderr.write.mock.calls[0]).toMatchSnapshot();
});
