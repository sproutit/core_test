// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals process */

"use exports DefaultLogger";

var utils = require('utils'),
    Ct    = require('core'),
    DefaultLogger = require('loggers/default'),

    SYS = require('sys'),
    print = SYS.print,
    println = SYS.puts; 

var COLORS = {};
COLORS[Ct.ERROR] = "5"; // magenta
COLORS[Ct.FAIL] = "1"; // red
COLORS[Ct.PASS] = "2"; // green
COLORS[Ct.WARN] = "3"; // yellow

/**
  Log output using the node APIs
*/
Ct.NodeLogger = utils.extend(DefaultLogger, {

  SPACES: '  ',
  indent: '',

  isVerbose: false,
  isColorEnabled: true,
  
  init: function() {
    DefaultLogger.prototype.init.apply(this, arguments);
    
    var env = process.env;
    if (env.VERBOSE !== undefined) this.isVerbose = env.VERBOSE;
    if (env.COLOR !== undefined) this.isColorEnabled = env.COLOR;
    if (env.QUIET !== undefined) this.isQuiet = env.QUIET;
    
    this.stats = { 
      tests: 0, assertions: 0, passed: 0, failed: 0, errors: 0, warnings: 0 
    };
    
  },
  
  // returns the summary - in color if isColorEnabled and your don't overload
  summary: function(inColor) {
    if (inColor === undefined) inColor = this.isColorEnabled;
    var stats = this.stats,
        ret = [];

    var k = ['passed', 'failed', 'errors', 'warnings'].reverse(),
        loc = k.length;
    while(--loc>=0) {
      var v = k[loc], 
          str = stats[v]+' '+v;
      if (inColor && (stats[v]>0)) str = this.colorize(COLORS[v], str);
      ret.push(str);    
    }
    
    return "Completed "+stats.assertions+" assertions in "+stats.tests+" tests: "+ret.join(', ');
  },

  colorize: function(color, str) {
    return "\033[3"+color+"m"+str+"\033[m";
  },
  
  groupBegin: function(str) {
    if (this.isVerbose) println(this.indent+str);
    this.indent = this.indent + this.SPACES;
  },
  
  groupEnd: function() {
    this.indent = this.indent.slice(0, 0-this.SPACES.length);
  },
  
  print: function(status, str) {
    if (str === undefined) {
      str = status;
      status = '';
    }

    // just show dots for each test of not verbose
    if (!this.isVerbose) {
      str = status===Ct.OK ? '.' : status.slice(0,1).toUpperCase();
    } else {
      str = this.indent+str+'\n';
    }
    
    // color if needed
    if (this.isColorEnabled) {
      var color = COLORS[status.toLowerCase()];
      if (color) str = this.colorize(color, str);
    }

    print(str);
  },
  
  begin: function(planName) {
    var state = this.state;
    if (!state) state = this.state = {};
    
    if (state.isRunning) throw "logger only supports one plan at a time";
    state.isRunning = true;
    //this.groupBegin(planName);
  },
  
  /**
    Called when a plan is finished funning.  This should be used to cleanup 
    any outstanding info and generate a final report based on collected stats
    
    Override this method in your subclass
    
    @param {String} planName the name of the plan to the invoke
    @returns {void}
  */
  end: function(planName) {
    var state = this.state, loc;
    if (!state || !state.isRunning) throw "plan must be running to end it";
    
    if (state.testName) this.groupEnd(state.testName);

    // end nested modules
    loc = state.moduleNames ? state.moduleNames.length : -1;
    while(--loc >= 0) this.groupEnd(state.moduleNames[loc]);

    this.groupEnd(planName);
    //this.print((planName||'') + ' plan complete.');

    this.state = null; // clear state
  },
  
  /**
    Called to log an assertion out.  First param is the status, second is the
    message.  Override this method in your subclass
    
    @param {String} status 
      status of the message.  Must be Ct.PASS, Ct.FAIL, Ct.ERROR, Ct.WARN
      
    @param {Hash} testInfo
      describes the test.  has moduleName, testName, mode.  mode is one of 
      Ct.SETUP_MODE, Ct.TEARDOWN_MODE, Ct.TEST_MODE
      
    @param {String} message
      optional message explaining the status
      
    @returns {void}
  */
  add: function(status, testInfo, message) {
    
    if (this.isQuiet && ((status === Ct.PASS) || (status === Ct.INFO))) {
      return;
    }
    
    var state = this.state, 
        testName, moduleNames, testMode, msg, len, idx, loc;
    
    if (!state || !state.isRunning) throw "plan must be running to log it";

    moduleNames = testInfo.moduleNames;
    if (!moduleNames || moduleNames.length===0) moduleNames = ['default'];

    testName   = testInfo.testName || 'default';
    testMode   = testInfo.mode || 'test';

    // find where the old and new set of modules names diverge
    if (!state.moduleNames) loc = 0;
    else {
      len = state.moduleNames.length;
      loc = -1;
      for(idx=0;(loc<0) && (idx<len); idx++) {
        if (state.moduleNames[idx] !== moduleNames[idx]) loc = idx; 
      }
      if (loc<0) loc = len;
    }
    
    // end current module and start new one if needed
    if (loc !== moduleNames.length) {
      
      // exit current modules if there are any
      idx = state.moduleNames ? state.moduleNames.length : 0;
      if (idx>loc) {
        this.groupEnd(state.testName);
        while(--idx >= loc) this.groupEnd(state.moduleNames[idx]);
      }
      
      // begin new module if needed
      len = moduleNames.length;
      if (loc<len) {
        for(idx=loc;idx<len;idx++) this.groupBegin(moduleNames[idx]);
        this.groupBegin(testName);
        this.stats.tests++;
      }
      
      state.moduleNames = moduleNames;
      state.testName = testName;

    // if module did not change, but test changed, handle that on its own
    } else if (state.testName !== testName) {
      if (state.testName) this.groupEnd(state.testName);
      this.groupBegin(testName);
      this.stats.tests++;
      state.testName = testName ;
    }

    // save assertions
    this.stats.assertions++;
    this.stats[status.toLowerCase()]++;
    
    // now log the message itself
    if (!status) status = '';
    if (testMode !== Ct.TEST_MODE) {
      msg = utils.fmt('%@: %@ in %@', status.toUpperCase(), message, testMode);
    } else msg = utils.fmt('%@: %@', status.toUpperCase(), message);

    this.print(status, msg);
  }
  
});

// make available to those directly importing this module
exports = module.exports = Ct.NodeLogger;
exports.NodeLogger = Ct.NodeLogger;

