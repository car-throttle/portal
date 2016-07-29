/**
 * Client. Runs in the parent page (the 3rd party domain).
 */
function PortalClient(opts) {
  this.path = opts.path;
  this.origin = opts.origin;
  this.callbacks = {};

  window.location.origin = window.location.origin || window.location.protocol + '//' + window.location.host;

  if (!window.parent.postMessage) throw new Error('Browser does not support postMessage!');
}

PortalClient.prototype.on = function (name, callback) {
  this.callbacks[name] = callback;
};

PortalClient.prototype.start = function (callback) {
  window.addEventListener('message', function (e) {
    if ((e.origin || e.originalEvent.origin) !== this.origin) return;
    if (this.callbacks[e.data.type]) this.callbacks[e.data.type](e.data.payload);
  }.bind(this));
  this.insertFrame(callback);
};

PortalClient.prototype.insertFrame = function (callback) {
  var frame = document.createElement('iframe');
  frame.src = this.origin + this.path + '?src=' + encodeURIComponent(window.location.origin);
  frame.style.visibility = 'hidden';
  frame.onload = function () {
    this.contentWindow = frame.contentWindow;
    if (callback) callback();
  }.bind(this);
  document.body.appendChild(frame);
};

PortalClient.prototype.send = function (type, payload) {
  if (!this.contentWindow) throw new Error('Cannot send event; frame not loaded');
  this.contentWindow.postMessage({ type: type, payload: payload }, this.origin);
};
