'use strict';

const fs = require('fs');
const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const normalizeHtmlError = require('./util/normalizeHtmlError');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');
const configClientSyntaxError = require('./configs/client-syntax-error');
const configServerRuntimeError = require('./configs/server-runtime-error');

describe('middleware', () => {
    afterEach(() => createCompiler.teardown());

    it('should wait for a successful compilation and call next()', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect(/Hello!/);
    });

    it('should wait for a failed compilation and render the webpack stats', () => {
        const app = express();
        const compiler = createCompiler(configClientSyntaxError, configServerBasic);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));

        return request(app)
        .get('/client.js')
        .expect(500)
        .expect((res) => {
            expect(normalizeHtmlError(res.text)).toMatchSnapshot();
        });
    });

    it('should render error if an error occurred while reading the server bundle', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerRuntimeError);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));

        compiler.server.webpackCompiler.outputFileSystem.readFile = (...args) => {
            args[args.length - 1](new Error('Failed to read file'));
        };
        compiler.server.webpackCompiler.outputFileSystem.readFileSync = () => {
            throw new Error('Failed to read file');
        };

        return request(app)
        .get('/client.js')
        .expect(500)
        .expect((res) => {
            expect(normalizeHtmlError(res.text)).toMatchSnapshot();
        });
    });

    it('should render error if i the server bundle has a runtime error', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerRuntimeError);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));

        return request(app)
        .get('/client.js')
        .expect(500)
        .expect((res) => {
            expect(normalizeHtmlError(res.text)).toMatchSnapshot();
        });
    });

    it('should call next(err) if not a middleware error', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);
        const contrivedError = new Error('foo');

        app.use((req, res, next) => {
            next(contrivedError);
        });
        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));
        app.use((err, req, res, next) => {  // eslint-disable-line handle-callback-err, no-unused-vars
            expect(err).toBe(contrivedError);
            res.send(`Captured contrived error: ${err.message}`);
        });

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect('Captured contrived error: foo');
    });

    it('should set res.locals.isomorphicCompilation', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);
        let isomorphicCompilation;

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
        }));

        app.get('*', (req, res) => {
            isomorphicCompilation = res.locals.isomorphicCompilation;
            res.send('Yes it works!');
        });

        return request(app)
        .get('/')
        .expect(200)
        .expect('Yes it works!')
        .then(() => {
            expect(isomorphicCompilation).toBeDefined();
            expect(isomorphicCompilation).toHaveProperty('stats.client');
            expect(isomorphicCompilation).toHaveProperty('stats.server');
            expect(isomorphicCompilation).toHaveProperty('exports.render');
        });
    });

    it('should not use in-memory filesystem if options.memoryFs = false', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            memoryFs: false,
            watchOptions: { report: false },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(fs.existsSync(`${compiler.client.webpackConfig.output.path}/client.js`)).toBe(true);
            expect(fs.existsSync(`${compiler.server.webpackConfig.output.path}/server.js`)).toBe(true);
        });
    });

    it('should not call watch() automatically if options.watchOptions = false', () => {
        const compiler = createCompiler(configClientBasic, configServerBasic);
        const spy = jest.spyOn(compiler, 'watch');

        webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: false,
        });

        expect(spy.mock.calls).toHaveLength(0);
        expect(compiler.isCompiling()).toBe(false);
    });

    it('should set headers as specified in options.headers', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: false },
            headers: { 'X-FOO': 'bar' },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect('X-FOO', 'bar')
        .expect(/Hello!/);
    });
});
