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
  window.addEventListener('message', this.handleMessage.bind(this));
  this.insertFrame(callback);
};

PortalClient.prototype.handleMessage = function (e) {
  if ((e.origin || e.originalEvent.origin) !== this.origin) return;
  if (!this.callbacks[e.data.type]) return;
  this.callbacks[e.data.type](e.data.payload, this.send.bind(this, e.data.response));
};

PortalClient.prototype.insertFrame = function (callback) {
  var frame = document.createElement('iframe');

  frame.src = this.origin + this.path + '?src=' + encodeURIComponent(window.location.origin);
  frame.style.visibility = 'hidden';
  frame.style.position = 'absolute';
  frame.style.top = '-100px';
  frame.style.left = '-100px';
  frame.style.border = 'none';
  frame.style.width = '0';
  frame.style.height = '0';

  frame.onload = function () {
    this.contentWindow = frame.contentWindow;
    if (callback) callback();
  }.bind(this);

  document.body.appendChild(frame);
};

PortalClient.prototype.send = function (name, payload, callback) {
  if (!this.contentWindow) throw new Error('Cannot send event; frame not loaded');
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

  this.contentWindow.postMessage({
    type: name,
    payload: payload,
    response: '_RESPONSE_' + name,
  }, this.origin);
};
