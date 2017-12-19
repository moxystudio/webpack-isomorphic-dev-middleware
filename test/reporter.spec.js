'use strict';

const pTry = require('p-try');
const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const createWritter = require('./util/createWritter');
const touchFile = require('./util/touchFile');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');
const configServerWithHashes = require('./configs/server-with-hashes');

const originalStderr = process.stderr;

afterEach(() => { process.stderr = originalStderr; });
afterEach(() => createCompiler.teardown());

it('should report stats only once by default', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);
    const writter = createWritter();

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: { write: writter },
    }));

    return pTry(() => (
        request(app)
        .get('/client.js')
        .expect(200)
    ))
    .then(() => new Promise((resolve) => {
        compiler.once('begin', resolve);
        // Need to add a little delay otherwise webpack won't pick it up..
        // This happens because the file is being written while chokidar is not yet ready (`ready` event not yet emitted)
        setTimeout(() => touchFile(configServerBasic.entry), 200);
    }))
    .then(() => (
        request(app)
        .get('/client.js')
        .expect(200)
    ))
    .then(() => {
        expect(writter.getReportOutput()).toMatchSnapshot();
    });
});

it('should not report anything if options.report is false', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerWithHashes);
    const writter = createWritter();

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    return request(app)
    .get('/client.js')
    .expect(200)
    .then(() => {
        expect(writter.getReportOutput()).toMatchSnapshot();
    });
});

describe('human errors', () => {
    it('should warn if hashes are being used in webpack config', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerWithHashes);
        const writter = createWritter();

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            report: { write: writter },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(writter.getReportOutput()).toMatchSnapshot();
        });
    });

    it('should not warn about hashes are being used in webpack config if options.memoryFs is false', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerWithHashes);
        const writter = createWritter();

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            memoryFs: false,
            report: { write: writter },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(writter.getReportOutput()).toMatchSnapshot();
        });
    });

    it('should not check human errors if options.report is false', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerWithHashes);
        const writter = createWritter();

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            memoryFs: false,
            report: { humanErrors: false, write: writter },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(writter.getReportOutput()).toMatchSnapshot();
        });
    });

    it('should not check human errors if options.report.humanErrors is false', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerWithHashes);
        const writter = createWritter();

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            memoryFs: false,
            report: { humanErrors: false, write: writter },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(writter.getReportOutput()).toMatchSnapshot();
        });
    });
});
