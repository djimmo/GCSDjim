goog.provide('MineGCS.AltSpeedView');

/**
 * Djim Molenkamp - djimmo@gmail.com
 * Altitude and Speed button integration into GCS
 * ..
 */

/**
 *  Altitude and Speed status button.
 * @param {{mavlinkSrc: MineGCS.MavlinkAPI, el: (Element|jQuery)}} properties
 *     Button properties.
 * @constructor
 * @extends {Backbone.View}
 */
MineGCS.AltSpeedView = function(properties) {
  goog.base(this, properties);
};\
goog.inherits(MineGCS.AltSpeedView, Backbone.View);


/**
 * @override
 * @export
 */
MineGCS.AltSpeedView.prototype.initialize = function() {
  var mavlink = this.options['mavlinkSrc'];
  this.vfrhud = mavlink.subscribe('VFR_HUD', this.onSysStatus, this);
  this.$el = this.options['el'];
};


/**
 * Handles SYS_STATUS mavlink messages.
 */
MineGCS.AltSpeedView.prototype.onSysStatus = function() {
  var gs = this.vfrhud.get('groundspeed');
  var alt = this.vfrhud.get('alt');
  var climb = this.vfrhud.get('climb');
  
  if (climb < -0.6) {
	this.setButton_('btn-danger', gs.toFixed(1) + 'm/s @ '  + alt.toFixed(1) + 'm');
  } else if (climb > 0.6) {
    this.setButton_('btn-warning', gs.toFixed(1) + 'm/s @ '  + alt.toFixed(1) + 'm');
  } else {
    this.setButton_('btn-success', gs.toFixed(1) + 'm/s @ '  + alt.toFixed(1) + 'm');
  }
};


/**
 * Sets the button state.
 * @param {string} cssClass The CSS class.
 * @param {string} textLabel The button label.
 * @private
 */
MineGCS.AltSpeedView.prototype.setButton_ = function(cssClass, textLabel) {
  this.$el.removeClass('btn-success btn-warning btn-danger btn-inverse');
  this.$el.addClass(cssClass);
  var html = '<span class="hidden-phone">' + textLabel + '</span>';
  html += '<i class="icon-plane icon-white visible-phone"></i>';
  this.$el.html(html);
};
