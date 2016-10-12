/**
 * Server. Runs inside an iframe on the 1st party domain.
 */
function PortalServer (opts) {
  this.callbacks = {};
  this.allowed_origins = opts.allowed_origins || [];
  this.parentOrigin = undefined;

  if (!window.parent) throw new Error('This page is not in an iframe!');
  if (!window.parent.postMessage) throw new Error('Browser does not support postMessage!');

  window.location.search.slice(1).split('&').forEach(function (param) {
    param = param.split('=');
    if (param[0] === 'src') this.parentOrigin = decodeURIComponent(param[1]);
  }.bind(this));

  if (!this.parentOrigin) throw new Error('No target origin provided');
  if (this.allowed_origins.indexOf(this.parentOrigin) < 0) throw new Error('Target origin not allowed');
}

PortalServer.prototype.on = function (name, callback) {
  this.callbacks[name] = callback;
};

PortalServer.prototype.start = function () {
  window.addEventListener('message', this.handleMessage.bind(this));
};

PortalServer.prototype.handleMessage = function (e) {
  if (this.allowed_origins.indexOf(e.origin || e.originalEvent.origin) < 0) return;
  if ((e.origin || e.originalEvent.origin) !== this.parentOrigin) return;
  if (!this.callbacks[e.data.type]) return;
  this.callbacks[e.data.type](e.data.payload, this.send.bind(this, e.data.response));
};

PortalServer.prototype.send = function (name, payload, callback) {
  if (!this.parentOrigin) throw new Error('Cannot send message to parent, no parent origin specified');
  var hasTriggered = false;

  if (callback) {
    this.on('_RESPONSE_' + name, function (responsePayload) {
      hasTriggered = true;
      this.callbacks['_RESPONSE_' + name] = null;
      callback.call(this, null, responsePayload);
    }.bind(this));
    window.setTimeout(function () {
      var err = new Error('Portal callback for ' + name + ' timed out');
      if (!hasTriggered) callback(err);
    }, 5000);
  }

  window.parent.postMessage({
    type: name,
    payload: payload,
    response: '_RESPONSE_' + name,
  }, this.parentOrigin);
};
