// ==========================================================================
// Project:   SproutCore Costello - Property Observing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals module exports */

var CoreTest = require('core');
var utils = require('utils');
var AssertionError, ok, equal, equals, 
    notEqual, deepEqual, sameEqual, deepNotEqual, raises, shouldThrow;

require('system/dump');
require('system/equiv'); 

/**
  @class
  
  Error thrown by assertions that have failed.  For these assertions you may
  also set the CoreTest.throwsOnFailure property to false.
  
  When throwing an error, pass any properties you want copied onto the error.
  The message, actual, and expected are required to properly log the output.
  
  h2. Examples
  
  Throwing an error:
  
  {{{
    new AssertionError({ message: "foo", expected: "bar", actual: "baz" });
  }}}
  
  Optional (non-standard) method using parameters:
  
  {{{
    new AssertionError('actual', 'expected', 'message');
  }}}
  
  @since SproutCore 1.1
*/
AssertionError = utils.extend(Error, {
  
  init: function(actual, expected, message) {
    if (arguments.length === 1) utils.mixin(this, actual);
    else {
      this.actual   = actual;
      this.expected = expected;
      this.message  = message;
    }

    this.desc = this.message;

    var ret = ['AssertionError:'];
    if (this.message) ret.push(this.message);
    if ((this.actual!==undefined) || (this.expected!==undefined)) {
      var act = CoreTest.dump(this.actual),
          exp = CoreTest.dump(this.expected);
      ret.push(utils.fmt('(actual = "%@" - expected = "%@")', act, exp));
    }
    this.message = ret.join(' ');

    return this ;
  },
  
  toString: function() {
    return this.message;
  }
    
});
exports.AssertionError = CoreTest.AssertionError = AssertionError;

// ..........................................................
// PRIMITIVE ASSERTION API - Provides CommonJS Parity
// 
  
/**
  Asserts that the first passed value is true.
  
  @param {Boolean} pass true if assertion passed
  @param {String} message optional message
  @param {Object} actual optional actual value to display
  @param {Object} expected optional expected value to display
  @returns {void}
*/
ok = function(pass, message, actual, expected) {
  var logger       = CoreTest.logger,
      raises  = CoreTest.throwsOnFailure,
      showVars     = arguments.length > 2,
      str;

  if (!logger) return this; // nothing to do

  if (showVars) {
    actual = CoreTest.dump(actual);
    expected = CoreTest.dump(expected);
  }
  
  if (pass) {
    str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
    logger.info(utils.fmt(str, message, actual, expected));
    
  } else if (raises) {
    throw new AssertionError(actual, expected, message);
    
  } else {
    str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
    logger.error(utils.fmt(str, message, actual, expected));
  }
  
  return pass;
};
CoreTest.ok = exports.ok = ok;

/**
  Asserts that the actual value (first value) is identical to the expected 
  value using ===.
  
  @param {Object} actual actual value of test
  @param {Object} expected expected value of test
  @param {String} message optional message
  @returns {Boolean} YES if passed
*/
equal = function equal(actual, expect, message) {
  message = utils.fmt('%@ should be equal', message);
  return CoreTest.ok(actual === expect, message, actual, expect);
};
CoreTest.equal = exports.equal = equal;
CoreTest.equals = exports.equals = equal; // Qunit compatibility

/**
  Asserts that the actual value is NOT identical to the expected value using 
  ===.
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} message optional message
  @returns {Boolean} YES if passed
*/
notEqual = function(actual, expect, message) {
  message = utils.fmt('%@ should not be equal', message);
  return CoreTest.ok(actual !== expect, message, actual, expect);
};
CoreTest.notEqual = exports.notEqual = notEqual;

/**
  Asserts the the actual value is the same as the expected value using a 
  deep comparison (CoreTest.equiv() if you must know).
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} msg optional message
  @returns {Boolean} YES if passed
*/
deepEqual = function(actual, expect, msg) {
  msg = utils.fmt('%@ should be deepEqual', msg);
  return CoreTest.ok(CoreTest.equiv(actual, expect), msg, actual, expect);
} ;
CoreTest.deepEqual = exports.deepEqual = deepEqual;
CoreTest.same = exports.same = deepEqual; // QUnit compatibility 

/**
  Asserts the the actual value is NOT the same as the expected value using a 
  deep comparison (CoreTest.equiv() if you must know).
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} msg optional message
  @returns {Boolean} YES if passed
*/
deepNotEqual = function(actual, expect, msg) {
  msg = utils.fmt('%@ should not be deepEqual', msg);
  return CoreTest.ok(!CoreTest.equiv(actual,expect), msg, actual, expect);
} ;
exports.deepNotEqual = CoreTest.deepNotEqual = deepNotEqual;

/**
  Asserts that the passed callback will throw the an error with the expected
  message.
  
  @param {Function} callback callback to execute
  @param {String} expected string of message or false if no exception expected
  @param {String} msg optional additonal message
  @returns {Boolean} YES if passed
*/
raises = function(callback, expected, msg) {
  var actual = false ;
  
  try {
    callback();
  } catch(e) {
    actual = (typeof expected === "string") ? e.message : e;        
  }
  
  if (expected===false) {
    CoreTest.ok(actual===false, utils.fmt("%@ expected no exception, actual %@", msg, actual));
  } else if (expected===Error || expected===null || expected===true) {
    CoreTest.ok(!!actual, utils.fmt("%@ expected exception, actual %@", msg, actual));
  } else {
    equals(actual, expected, msg);
  }
};
CoreTest.raises = exports.raises = raises;
CoreTest.shouldThrow = exports.shouldThrow = raises; // old CoreTest compat

