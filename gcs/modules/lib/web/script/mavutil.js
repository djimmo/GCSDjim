goog.provide('GCSDjimMolenkamp.util');

goog.require('goog.object');


/**
 * Contains static methods for utility functions on heartbeat mavlink
 * messages.
 */
GCSDjimMolenkamp.util.heartbeat = {};


/**
 * Bitfields for base_mode.
 * @enum {number}
 */
GCSDjimMolenkamp.util.MavModeFlag = {
  CUSTOM_MODE_ENABLED: 1,
  TEST_ENABLED: 2,
  AUTO_ENABLED: 4,
  GUIDED_ENABLED: 8,
  STABILIZE_ENABLED: 16,
  HIL_ENABLED: 32,
  MANUAL_INPUT_ENABLED: 64,
  SAFETY_ARMED: 128
};


/**
 * Vehicle types
 * @enum {number}
 */

GCSDjimMolenkamp.util.MavType = {
  FIXED_WING: 1,
  QUADROTOR: 2
};


/**
 * ArduPlane flight modes.
 * @type {Object.<number, string>}
 */
GCSDjimMolenkamp.util.ArduPlaneFlightModes = {
  0: 'MANUAL',
  1: 'CIRCLE',
  2: 'STABILIZE',
  5: 'FBWA',
  6: 'FBWB',
  7: 'FBWC',
  10: 'AUTO',
  11: 'RTL',
  12: 'LOITER',
  13: 'TAKEOFF',
  14: 'LAND',
  15: 'GUIDED',
  16: 'INITIALIZING'
};


/**
 * ArduCopter flight modes
 * @type {Object.<number, string>}
 */
GCSDjimMolenkamp.util.ArduCopterFlightModes = {
  0: 'STABILIZE',
  1: 'ACRO',
  2: 'ALT_HOLD',
  3: 'TAKEOFF',  // change from AUTO
  4: 'GUIDED',
  5: 'LOITER',
  6: 'RTL',
  7: 'CIRCLE',
  8: 'POSITION',
  9: 'LAND',
  10: 'OF_LOITER',
  11: 'APPROACH'
};


/**
 * Returns the vehicle type name.
 *
 * @param {GCSDjimMolenkamp.MavlinkMessage} msg A heartbeat message.
 * @return {string} The type of vehicle: "ArduCopter", "ArduPlane" or
 *     "unknown".
 *
 */
GCSDjimMolenkamp.util.heartbeat.mavtype = function(msg) {
  var type = msg.get('type');
  if (type == GCSDjimMolenkamp.util.MavType.QUADROTOR)
    return 'ArduCopter';
  if (type == GCSDjimMolenkamp.util.MavType.FIXED_WING)
    return 'ArduPlane';
  return 'unknown';
};


/**
 * Returns the name of the vehicle flight mode.
 * @param {GCSDjimMolenkamp.MavlinkMessage} msg A heartbeat message.
 * @return {string} The name of the flight mode.
 */
GCSDjimMolenkamp.util.heartbeat.modestring = function(msg) {
  var base_mode = msg.get('base_mode');
  var type = msg.get('type');
  var custom_mode = msg.get('custom_mode');

  if (base_mode === null || type === null || custom_mode === null) {
    return 'badmode';
  }
/** 
 * Removed from below if statement to get function
 * recognition back in APM3.1
 * type == GCSDjimMolenkamp.util.MavType.QUADROTOR && 
 */
  if (!base_mode & GCSDjimMolenkamp.util.MavModeFlag.CUSTOM_MODE_ENABLED) {
    return ('BaseMode(' + base_mode + ')');
  } else if (goog.object.containsKey(GCSDjimMolenkamp.util.ArduCopterFlightModes,
                                     custom_mode)) {
    return GCSDjimMolenkamp.util.ArduCopterFlightModes[custom_mode];
  } else if (type == GCSDjimMolenkamp.util.MavType.FIXED_WING &&
             goog.object.containsKey(GCSDjimMolenkamp.util.ArduPlaneFlightModes,
                                     custom_mode)) {
    return GCSDjimMolenkamp.util.ArduPlaneFlightModes[custom_mode];
  }
  return ('CustomMode(' + custom_mode + ')');
};


/**
 * Checks whether the vehicle is armed.
 *
 * @param {GCSDjimMolenkamp.MavlinkMessage} msg A heartbeat message.
 * @return {?boolean} True if the vehicle is armed.
 */
GCSDjimMolenkamp.util.heartbeat.armed = function(msg) {
  var base_mode = msg.get('base_mode');
  if (base_mode === null) {
    return null;
  }
  if (base_mode & GCSDjimMolenkamp.util.MavModeFlag.SAFETY_ARMED) {
    return true;
  }
  return false;
};
