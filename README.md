# webpack-isomorphic-dev-middleware

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] [![Greenkeeper badge][greenkeeper-image]][greenkeeper-url]

[npm-url]:https://npmjs.org/package/webpack-isomorphic-dev-middleware
[npm-image]:http://img.shields.io/npm/v/webpack-isomorphic-dev-middleware.svg
[downloads-image]:http://img.shields.io/npm/dm/webpack-isomorphic-dev-middleware.svg
[travis-url]:https://travis-ci.org/moxystudio/webpack-isomorphic-dev-middleware
[travis-image]:http://img.shields.io/travis/moxystudio/webpack-isomorphic-dev-middleware/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/webpack-isomorphic-dev-middleware
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/webpack-isomorphic-dev-middleware/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/webpack-isomorphic-dev-middleware
[david-dm-image]:https://img.shields.io/david/moxystudio/webpack-isomorphic-dev-middleware.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/webpack-isomorphic-dev-middleware#info=devDependencies
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/webpack-isomorphic-dev-middleware.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/webpack-isomorphic-dev-middleware.svg
[greenkeeper-url]:https://greenkeeper.io

The [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) but for isomorphic applications.

![Showcase](http://i.imgur.com/ere1oxN.gif)


## Installation

`$ npm install webpack-isomorphic-dev-middleware --save-dev`

The current version only works with webpack v2.x.x.


## Motivation

Building applications powered by webpack with server-side rendering (isomorphic/universal apps) is hard:

- When making a production build, you must compile both the client and server
- When developing, we want to rebuild the client & server whenever code changes and offer hot module replacement

This is complex, especially setting up the development server:

- You must wait for both compilers to finish, delaying the server responses until then
- If the client or server compilation fails, an error page should be served
- When the server compilations succeeds, we must re-require the server file to get its new exports
- The client and server compilers must be in sync and live in perfect harmony

To solve the compilation part, [webpack-isomorphic-compiler](https://github.com/moxystudio/webpack-isomorphic-compiler) offers an aggregated compiler that syncs up the client and server compilation.
To solve the development part, `webpack-isomorphic-dev-middleware` offers an express middleware that integrates seamlessly with `webpack-isomorphic-compiler`.


## Usage

During development we want to build whenever our code changes, in both the client and the server.   
This middleware makes that insanely easy:

```js
const express = require('express');
const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const webpackIsomorphicDevMiddleware = require('webpack-isomorphic-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const isomorphicCompiler = webpackIsomorphicCompiler(clientConfig, serverConfig);
const app = express();

// Serve any static files from the public folder
app.use('/', express.static('public', { maxAge: 0, etag: false }));
// Add the middleware that will wait for both client and server compilations to be ready
app.use(webpackIsomorphicDevMiddleware(isomorphicCompiler));
// You may also add webpack-hot-middleware to provide hot module replacement to the client
app.use(webpackHotMiddleware(isomorphicCompiler.client.webpackCompiler, { quiet: true }));

// Catch all route to attempt to render our isomorphic app
app.get('*', (req, res, next) => {
    // res.isomorphicCompilation contains `stats` & `exports` properties:
    // - `stats` contains the client & server stats
    // - `exports` contains the server exports, usually one or more render functions
    const { render } = res.locals.isomorphicCompilation.exports;

    render({ req, res })
    .catch((err) => setImmediate(() => next(err)));
});
```

Available options:

| Name   | Description   | Type     | Default |
| ------ | ------------- | -------- | ------- |
| memoryFs | Either disable or enable in-memory filesystem (disabling decreases performance) | boolean | true |
| watchOptions | Options to pass to [compiler.watch(options)](https://github.com/moxystudio/webpack-isomorphic-compiler#watchoptions-handler) or falsy to not call watch() | object/boolean | `{ report: { stats: 'once' } }` |
| headers | Headers to be sent when serving compilation files | object | null |


### Perks

- Looks for code changes and automatically compiles by using [watch](https://github.com/moxystudio/webpack-isomorphic-compiler#watchoptions-handler)
- Optimizes compilation by using in-memory filesystem
- Delays responses until the aggregated compiler finishes
- Adds `isomorphicCompilation` to [res.locals](https://expressjs.com/en/api.html#res.locals) and call `next()` if the aggregated compilation succeeds
- Warns about mistakes in your webpack configuration
- Beautiful compilation reporting into your terminal
- Shows compilation errors in the browser on refresh, similar to the ones you get on the terminal


## Tests

`$ npm test`   
`$ npm test:watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
