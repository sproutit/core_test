// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals CoreTest exports */

var utils = require('utils'),
	CoreTest;

/** @namespace

  CoreTest is the unit testing library for SproutCore.  It includes a test 
  runner based on QUnit with some useful extensions for testing SproutCore-
  based applications.
  
  You can use CoreTest just like you would use QUnit in your tests directory.
*/
CoreTest = {
  
  /**
    If set to false, then built-in assertions will simply record errors to the
    current logger instead of throwing an error, stopping the unit test.
    
    @property {Boolean}
  */
  throwsOnFailure: true,
  
  /**
    Set to a logger object during a test run.
    
    @property {Logger}
  */
  logger: null,  

  /** Test is OK */
  OK: 'passed',
  
  /** Test failed */
  FAIL: 'failed',
  
  /** Test raised exception */
  ERROR: 'errors',
  
  /** Test raised warning */
  WARN: 'warnings',
  
  showUI : false
  
};

exports = module.exports = CoreTest;
exports.CoreTest = CoreTest;

