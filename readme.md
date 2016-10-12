#Portal

An very simple wrapper around [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) that makes cross-domain communication with iframes easy.

### Scenario - SSO

You run a network of websites. You want one user account to remain logged-in across all of the websites. You could use traditional single-sign-on (SSO) and redirects to share authentication state with each website (each website will drop it's own cookie). But what if you want the user (who has logged-in on one of the other sites) to be logged-in when they first land on the page?

Since you can't share localStorage or cookies between different domains, you must somehow check a shared SSO domain for the authentication token (which will be in a cookie or localStorage). The way we can achieve this communication is with an iframe, and the `postMessage` API. This event-driven system will let us pass messages between the two domains. We can "ask" the iframe (hosted on a secure, shared domain that we control) whether the user has an auth token. The iframe can "reply" with the details, or perform the authentication process. This implementation is up to the developer.

This library wraps `postMessage` to create a simple 2-way event bus system. There are 2 components: client and server. Server will run inside your iframe, and client can run anywhere. We use simple origin whitelists to make sure requests can't come from nefarious sources. It's your own fault if you screw this up.

This library does not attempt to polyfill `postMessage` at all. If you want comprehensive cross-browser and progressively-enhanced features, why not check out [Porthole](https://ternarylabs.github.io/porthole/).

### Usage

JS in your iframe e.g. "https://sso.mydomain.com/crossdomain.html"
with `<script src="/path/to/portal.server.min.js"></script>` or module-load it.

```
var PortalServer = require('iframe-portal').Server;
// or use window.PortalServer

var portal = new PortalServer({
  allowed_origins: [ 'http://untrusteddomain.com' ]
});

portal.on('PING', function (payload) {
  // Do something with payload?
  portal.send('PONG', { foo: 'bar' });
});

portal.start();
```

JS on the client page e.g. "http://untrusteddomain.com"
with `<script src="/path/to/portal.client.min.js"></script>` or module-load it.

```
var PortalClient = require('iframe-portal').Client;
// or use: window.PortalClient

var portal = new PortalClient({
  path: '/crossdomain.html',
  origin: 'https://sso.mydomain.com'
});

portal.on('PONG', function (payload) {
  console.log(payload.foo); // 'bar'
});

portal.start(function () {
  // We can start sending events now that the "portal is open"
  portal.send('PING');

  // We can attach callbacks to some events
  portal.send('DO_ASYNC_THING', { foo: 'bar' }, function (err, payload) {
    // Err will be an error object if the callback is not called in time (5 seconds).
    // Do something with payload?
  });

});

```

### Browser support

Same as `postMessage`. should work back to IE8. If you find a replicable issue, file a pull-request please instead of complaining.
