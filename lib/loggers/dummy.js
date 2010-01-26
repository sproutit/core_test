// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var utils = require('utils'),
    Ct    = require('core');
    
require('loggers/default'); // add Ct.DefaultLogger
    

/**
  DummyLogger simply logs any results into an internal array.  Most useful 
  for testing log output then testing the test framework itself.
  
  @extends Ct.DefaultLogger
*/
Ct.DummyLogger = utils.extend(Ct.DefaultLogger, 
  /** @scope Ct.DummyLogger.prototype */{
  
  name: 'dummy',

  BEGIN: 'begin',
  
  END: 'end',
  
  TEST: 'test',
  
  /**
    Populated with items describing the log history.  Each item in this 
    array witll be a hash contains the following properties:
    
     - plan: name of the plan
     - module: name of the module
     - test: name of the test
     - message: message
  
    @property {Array}
  */
  history: null,

  /**
    Resets the log history
  */
  reset: function() {
    this.history = [];
  },
  
  init: function() {
    Ct.DefaultLogger.prototype.init.apply(this, arguments);
    this.reset();
  },

  /**
    Looks for a message matching a passed template.  Returns the message if 
    found or null if none matches.
  */
  find: function(templ) {
    var hist = this.history,
        len  = hist ? hist.length : 0,
        idx, item, key, isMatch;
        
    for(idx=0;idx<len;idx++) {
      item = hist[idx];
      isMatch = true; 
      for(key in templ) {
        if (!templ.hasOwnProperty(key)) continue;
        if (item[key] !== templ[key]) isMatch = false;
      }
      if (isMatch) return item;
    }
    
    return null;
  },
  
  // ..........................................................
  // CORE API - Overide in your subclass
  // 
  
  begin: function(planName) {
    this.history.push({ plan: planName, kind: this.BEGIN });
    this.currentPlan = planName;
  },
  
  end: function(planName) {
    this.history.push({ plan: planName, kind: this.END }) ;
    this.currentPlan = null;
  },
  
  add: function(status, testInfo, message) {
    this.history.push({
      kind: this.TEST,
      plan: this.currentPlan,
      module: testInfo.moduleName,
      test: testInfo.testName,
      status: status,
      message: message,
      mode: testInfo.mode
    });
  }
  
});

// make available to those directly importing this module
exports = module.exports = Ct.DummyLogger;
exports.DummyLogger = Ct.DummyLogger;

