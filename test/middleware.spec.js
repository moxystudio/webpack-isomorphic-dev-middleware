'use strict';

const fs = require('fs');
const pTry = require('p-try');
const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const normalizeHtmlError = require('./util/normalizeHtmlError');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');
const configClientSyntaxError = require('./configs/client-syntax-error');
const configServerRuntimeError = require('./configs/server-runtime-error');

afterEach(() => createCompiler.teardown());

it('should wait for a successful compilation and call next()', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
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
        report: false,
    }));

    return request(app)
    .get('/client.js')
    .expect(500)
    .expect((res) => {
        expect(normalizeHtmlError(res.text)).toMatchSnapshot();
    });
});

it('should render error if an error occurred while reading the server file', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerRuntimeError);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    compiler.server.webpackCompiler.outputFileSystem.readFile = (...args) => {
        args[args.length - 1](new Error('Failed to read file'));
    };

    return request(app)
    .get('/client.js')
    .expect(500)
    .expect((res) => {
        expect(normalizeHtmlError(res.text)).toMatchSnapshot();
    });
});

it('should render error if the server file has a runtime error', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerRuntimeError);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
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
        report: false,
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
        report: false,
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

it('should cache the res.locals.isomorphicCompilation', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);
    let isomorphicCompilation;

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    app.get('*', (req, res) => {
        if (!isomorphicCompilation) {
            isomorphicCompilation = res.locals.isomorphicCompilation;
        } else {
            expect(res.locals.isomorphicCompilation).toBe(isomorphicCompilation);
        }

        res.send('Yes it works!');
    });

    const spy = jest.spyOn(compiler.server.webpackCompiler.outputFileSystem, 'readFile');

    return pTry(() => (
        request(app)
        .get('/')
        .expect(200)
        .expect('Yes it works!')
    ))
    .then(() => (
        request(app)
        .get('/')
        .expect(200)
        .expect('Yes it works!')
    ))
    .then(() => {
        expect(spy.mock.calls).toHaveLength(1);
    });
});

it('should not re-require the server file if it has a runtime error', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerRuntimeError);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
    }));

    const spy = jest.spyOn(compiler.server.webpackCompiler.outputFileSystem, 'readFile');

    return pTry(() => (
        request(app)
        .get('/')
        .expect(500)
        .expect((res) => {
            expect(normalizeHtmlError(res.text)).toMatchSnapshot();
        })
    ))
    .then(() => (
        request(app)
        .get('/')
        .expect(500)
        .expect((res) => {
            expect(normalizeHtmlError(res.text)).toMatchSnapshot();
        })
    ))
    .then(() => {
        expect(spy.mock.calls).toHaveLength(1);
    });
});

it('should not use in-memory filesystem if options.memoryFs is false', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        memoryFs: false,
        report: false,
    }));

    return request(app)
    .get('/client.js')
    .expect(200)
    .then(() => {
        expect(fs.existsSync(`${compiler.client.webpackConfig.output.path}/client.js`)).toBe(true);
        expect(fs.existsSync(`${compiler.server.webpackConfig.output.path}/server.js`)).toBe(true);
    });
});

it('should watch() with the specified options.watchDelay', (next) => {
    const compiler = createCompiler(configClientBasic, configServerBasic);
    const now = Date.now();

    webpackIsomorphicDevMiddleware(compiler, { watchDelay: 100 });

    compiler.watch = () => {
        expect(Date.now() - now).toBeGreaterThanOrEqual(100);
        next();
    };
});

it('should set headers as specified in options.headers', () => {
    const app = express();
    const compiler = createCompiler(configClientBasic, configServerBasic);

    app.use(webpackIsomorphicDevMiddleware(compiler, {
        report: false,
        headers: { 'X-FOO': 'bar' },
    }));

    return request(app)
    .get('/client.js')
    .expect(200)
    .expect('X-FOO', 'bar')
    .expect(/Hello!/);
});
