goog.provide('MineGCS.MavlinkAPI');
goog.provide('MineGCS.MavlinkMessage');

goog.require('MineGCS.FakeVehicle');

goog.require('goog.debug.Logger');



/**
 * A mavlink message.
 *
 * @param {{_type: string, _index: number}} attrs The message attributes.
 * @constructor
 * @extends {Backbone.Model}
 */
MineGCS.MavlinkMessage = function(attrs) {
  goog.base(this, attrs);
};
goog.inherits(MineGCS.MavlinkMessage, Backbone.Model);



/**
 * Fetches the most recent mavlink messages of interest from the
 * server.
 *
 * @param {{url: string}} attrs Attributes.
 * @constructor
 * @extends {Backbone.Model}
 */
MineGCS.MavlinkAPI = function(attrs) {
  goog.base(this, attrs);
};
goog.inherits(MineGCS.MavlinkAPI, Backbone.Model);


/**
 * @override
 * @export
 */
MineGCS.MavlinkAPI.prototype.initialize = function() {
  /** @type {goog.debug.Logger} */
  this.logger_ = goog.debug.Logger.getLogger('mavelous.MavlinkAPI');
  /** @type {string} */
  this.url = this.get('url');
  /** @type {boolean} */
  this.gotonline = false;
  /** @type {boolean} */
  this.online = true;
  /** @type {number} */
  this.failcount = 0;
  // Table of message models, keyed by message type.
  /** @type {Object.<string, MineGCS.MavlinkMessage>} */
  this.messageModels = {};
  /** @type {?MineGCS.FakeVehicle} */
  this.fakevehicle = null;
};


/**
 * Registers a handler for a mavlink message type.
 *
 * @param {string} msgType The type of message.
 * @param {function(Object)} handlerFunction The message handler function.
 * @param {Object} context Specifies the object which |this| should
 *     point to when the function is run.
 * @return {MineGCS.MavlinkMessage} The message model.
 */
MineGCS.MavlinkAPI.prototype.subscribe = function(
    msgType, handlerFunction, context) {
  if (!this.messageModels[msgType]) {
    this.messageModels[msgType] = new MineGCS.MavlinkMessage({
      '_type': msgType,
      '_index': -1});
  }
  var model = this.messageModels[msgType];
  model.bind('change', handlerFunction, context);
  return model;
};


/**
 * Handles an array of incoming mavlink messages.
 * @param {Object} msgEnvelopes The messages.
 * @private
 */
MineGCS.MavlinkAPI.prototype.handleMessages_ = function(msgEnvelopes) {
  this.trigger('gotServerResponse');
  _.each(msgEnvelopes, this.handleMessage_, this);
};


/**
 * Handles an incoming message.
 *
 * @param {Object} msg The JSON mavlink message.
 * @param {string} msgType The message type.
 * @private
 */
MineGCS.MavlinkAPI.prototype.handleMessage_ = function(msg, msgType) {
  // Update the model if this is a new message for this type.
  var msgModel = this.messageModels[msgType];
  var mdlidx = msgModel.get('_index');
  if (mdlidx === undefined || msg.index > mdlidx) {
    msgModel.set({
      '_index': msg.index
    }, {
      'silent': true
    });
    msgModel.set(msg.msg);
  }
};


/**
 * Gets the latest mavlink messages from the server (or from the fake
 * model, if we're offline).
 */
MineGCS.MavlinkAPI.prototype.update = function() {
  if (this.online) {
    this.onlineUpdate();
  } else {
    this.offlineUpdate();
  }
};


/**
 * Gets the latest mavlink messages from the server.
 */
MineGCS.MavlinkAPI.prototype.onlineUpdate = function() {
  $.ajax({
    context: this,
    type: 'GET',
    cache: false,
    url: this.url + _.keys(this.messageModels).join('+'),
    datatype: 'json',
    success: function(data) {
      this.gotonline = true;
      this.handleMessages_(data);
    },
    error: function() {
      this.trigger('gotServerError');
      if (!this.gotonline) {
        this.failcount++;
        if (this.failcount > 5) {
          this.useOfflineMode();
        }
      }
    }
  });
};


/**
 * Gets the latest fake messages if we're in offline mode.
 */
MineGCS.MavlinkAPI.prototype.offlineUpdate = function() {
  goog.asserts.assert(this.fakevehicle);
  this.fakevehicle.update();
  var msgs = this.fakevehicle.requestMessages(this.messageModels);
  this.handleMessages_(msgs);
};


/**
 * Switches to offline mode.
 */
MineGCS.MavlinkAPI.prototype.useOfflineMode = function() {
  if (this.online && !this.gotonline) {
    this.logger_.info('Switching to offline mode');
    this.online = false;
    this.fakevehicle = new MineGCS.FakeVehicle({
      'lat': 45.5233, 'lon': -122.6670
    });
  }
};
