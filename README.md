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
[david-dm-dev-url]:https://david-dm.org/moxystudio/webpack-isomorphic-dev-middleware?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/webpack-isomorphic-dev-middleware.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/webpack-isomorphic-dev-middleware.svg
[greenkeeper-url]:https://greenkeeper.io

The [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware), but for isomorphic applications.

![Showcase](http://i.imgur.com/rgy7QcT.gif)


## Installation

`$ npm install webpack-isomorphic-dev-middleware --save-dev`

The current version works with webpack v2 and v3.


## Motivation

Building applications powered by webpack with server-side rendering (isomorphic/universal apps) is hard.

When making a production build, you must compile both the client and server. When developing, we want to rebuild the client & server and bring in the new compiled code without restarting/reloading the application. This is complex, especially setting up the development server.

To make your development workflow easier to setup, `webpack-isomorphic-dev-middleware` offers an express middleware that:

- Looks for code changes in both the client and the server and automatically compiles them
- Optimizes compilation by using in-memory filesystem
- Delays responses until the aggregated compiler finishes
- Adds `isomorphic` to [res.locals](https://expressjs.com/en/api.html#res.locals), which includes the webpack stats and the methods exported in your server file
- Offers beautiful compilation [reporting](https://github.com/moxystudio/webpack-isomorphic-compiler-reporter) into your terminal
- Receive status through OS [notifications](https://github.com/moxystudio/webpack-sane-compiler-notifier)
- Shows compilation errors in the browser on refresh, similar to the ones you get on the terminal


## Usage

```js
const express = require('express');
const webpack = require('webpack');
const webpackIsomorphicDevMiddleware = require('webpack-isomorphic-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const clientCompiler = webpack({ /* webpack client config */ });
const serverCompiler = webpack({ /* webpack server config */ });
const app = express();

// Serve any static files from the public folder
app.use('/', express.static('public', { maxAge: 0, etag: false }));
// Add the middleware that will wait for both client and server compilations to be ready
app.use(webpackIsomorphicDevMiddleware(clientCompiler, serverCompiler));
// You may also add webpack-hot-middleware to provide hot module replacement to the client
app.use(webpackHotMiddleware(clientCompiler, { quiet: true }));

// Catch all route to attempt to render our isomorphic app
app.get('*', (req, res, next) => {
    // res.isomorphic contains `compilation` & `exports` properties:
    // - `compilation` contains the webpack-isomorphic-compiler compilation result
    // - `exports` contains the server exports, usually one or more render functions
    const { render } = res.locals.isomorphic.exports;

    render({ req, res })
    .catch((err) => setImmediate(() => next(err)));
});
```

Available options:

| Name   | Description   | Type     | Default |
| ------ | ------------- | -------- | ------- |
| memoryFs | Either disable or enable in-memory filesystem (disabling decreases performance) | boolean | true |
| watchOptions | Options to pass to webpack\'s watch | [object](https://webpack.js.org/configuration/watch/#watchoptions) | {} |
| watchDelay | Delay calling webpack\'s watch for the given milliseconds | number | 0 |
| report | Enables reporting | boolean/[object](https://github.com/moxystudio/webpack-isomorphic-compiler-reporter#available-options) | `{ stats: 'once' }`
| notify | Report build status through OS notifications | boolean/[object](https://github.com/moxystudio/webpack-sane-compiler-notifier#available-options) | false |
| headers | Headers to be sent when serving compiled files | object | null |


The middleware function is flexible and supports various signatures:

- Two separate webpack compilers

```js
const clientCompiler = webpack({ /* webpack client config */ });
const serverCompiler = webpack({ /* webpack server config */ });

app.use(webpackIsomorphicDevMiddleware(clientCompiler, serverCompiler, { /* options */ }));
```

- A webpack multi-compiler where the first and second indexes belong to the client and server respectively, see https://webpack.js.org/api/node

```js
const compiler = webpack([
    /* webpack client config */,
    /* webpack server config */,
]);

app.use(webpackIsomorphicDevMiddleware(compiler, { /* options */ }));
```

- A [webpack-isomorphic-compiler](https://github.com/moxystudio/webpack-isomorphic-compiler) that simplifies compiling isomorphic apps

```js
const isomorphicCompiler = webpackIsomorphicCompiler(
    /* webpack client config */,
    /* webpack server config */
);

app.use(webpackIsomorphicDevMiddleware(isomorphicCompiler, { /* options */ }));
```


## Tests

`$ npm test`   
`$ npm test -- --watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
