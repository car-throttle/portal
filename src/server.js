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

PortalServer.prototype.send = function(type, payload) {
  if (!this.parentOrigin) throw new Error('Cannot send message to parent, no parent origin specified');
  window.parent.postMessage({ type: type, payload: payload }, this.parentOrigin);
};

PortalServer.prototype.start = function () {
  window.addEventListener('message', function (e) {
    if (this.allowed_origins.indexOf(e.origin || e.originalEvent.origin) < 0) return;
    if ((e.origin || e.originalEvent.origin) !== this.parentOrigin) return;
    if (this.callbacks[e.data.type]) this.callbacks[e.data.type](e.data.payload);
  }.bind(this));
};
