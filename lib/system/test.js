// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================


var utils       = require('utils'),
    Ct          = require('core'),
    Assertable  = require('assert').xCoreTestAssertable;

require('system/dump'); // add Ct.dump
 
/**
  Describes a single test.  To run a test must be scheduled as part of a 
  module.  If the test is async then the handler will be passed a promise 
  which is much resolve or cancel for the test run to continue.
*/
Ct.Test = utils.extend(Assertable, {
  
  /**
    Human readable test description.  This will be used when logging test
    results.
    
    @param {String}
  */
  name: null,

  /**
    Set an alternate context to run the handler.  You can use this to control
    the value of "this" when your handler runs.  The setup and teardown 
    functions for a test will also have this same context when run.
    
    If no context is set, the test object itself will be used as the value of
    "this".
    
    @property {Object}
  */
  context: null,

  /**
    The current test execution mode.  Normally this value will remain 
    Ct.PLANNING_MODE, but when the test is actually running it will be one of
    Ct.SETUP_MODE, Ct.TEARDOWN_MODE, or Ct.TEST_MODE.  This is mostly used by
    the logger API to determine how a test result should be logged.
  */
  mode: Ct.PLANNING_MODE,

  /**
    Returns the plan that this test current belongs to.  Computed from the
    plan's module.
    
    @returns {Ct.Plan}
  */
  plan: function() {
    var mod = this.module();
    return mod ? mod.plan() : null;
  },

  /**
    Returns the module the test belongs to.  You can also set the module by
    passing it as a parameter to this method.  If you set the module returns
    the receiver.
    
    @param {Ct.Module} newModule
      (Optional) new module to set for this test
      
    @returns {Ct.Module|Ct.Test} module as getter, receiver as setter
  */
  module: function(newModule) {
    if (arguments.length===0) return this._module;    
    this._module = newModule;
    return this;
  },

  /**
    Returns the current logger for the test.  This is actually computted from
    the current plan.
    
    @returns {Ct.DefaultLogger} CoreTest logger instance
  */
  logger: function() {
    return this.plan().logger();  
  },
  

  // ..........................................................
  // PRIMITIVE API
  // 

  /**
    Set the number of expected assertions for the current phase.
  */
  expect: function(assertCount) {
    if (arguments.length === 0) return this._expectedAsserts;
    this._expectedAsserts = assertCount;
    return this;
  },
  
  /**
    Registers a timeout, if there isn't one already.  The current phase
    of the test must finish before the timeout expires or else the test 
    will be failed.
    
    Setting a timeout more than once will replace the old timeout.
  */
  timeout: function(amt, msg, done) {
    this._cancelTimeout();
    
    var test = this;

    if (msg && !done && ('function' === typeof msg)) {
      done = msg;
      msg = null;
    }
    
    if (!msg) msg = '';
    msg = 'timeout '+msg;
    
    this._phaseTimeout= setTimeout(function() {
      test._phaseTimeout = null;
      test.assert(false, msg, true, false);
      done();
    }, amt);
  },
  
  _cancelTimeout: function() {
    if (this._phaseTimeout) {
      clearTimeout(this._phaseTimeout);
      this._phaseTimeout = null;
    }
  },
  
  /** 
    Primitive to assert a given test.  This will invoke the proper callback on
    the test plan logger as long as you are actually running a test.  
    
    @param {Boolean} pass
      truthy value indicating whether the assertion should pass or fail
    
    @param {String} message
      (Optional) log message describing the assertion
      
    @param {Object} actual
      (Optinal) actual value to log [no comparison will be performed]

    @param {Object} expected
      (Optional) expected value to log [no comparison will be performed]
    
    @returns {Ct.Test} receiver
  */
  assert: function(pass, message, actual, expected) {
    
    if (this.mode === Ct.PLANNING_MODE) {
      throw utils.fmt("Cannot assert while test is not running (%@)", this);
    }
    
    var logger   = this.logger(),
        plan     = this.plan(),
        raises   = plan ? plan.throwsOnFailure : false,
        showVars = arguments.length > 2,
        str;

    if (!pass) this.didFail = true; 
    this._actualAsserts++;
    
    if (showVars) {
      actual = Ct.dump(actual);
      expected = Ct.dump(expected);
    }

    if (pass) {
      str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
      logger.pass(this, utils.fmt(str, message, actual, expected));

    } else if (raises) {
      throw new Ct.AssertionError(actual, expected, message);

    } else {
      str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
      logger.fail(this, utils.fmt(str, message, actual, expected));
    }
    
    return this;
  },
  
  /**
    Primitive to log an error messages.  This is invoked if the test 
    encounters an unexpected exception while running.
  
    @param {String|Error} message message or exception to log
    @returns {Ct.Test} receiver
  */
  error: function(message) {
    if (this.mode === Ct.PLANNING_MODE) {
      throw utils.fmt("Cannot assert error while test is not running (%@)", this);
    }

    this.didFail = true ;
    this.logger().error(this, message);
    return this;
  },

  /**
    Adds some info to the logger.  Not a test - just some output.
    
    @param {String} the message to log
    @returns {Ct.Test} receiver
  */
  info: function(message) {
    if (this.mode === Ct.PLANNING_MODE) {
      throw utils.fmt("Cannot log info while test is not running (%@)", this);
    }
    this.logger().info(this, message);
    return this;
  },
  
  /**
    Returns a function that you can execute at a later time to actually run
    the test.  When you invoke the function, you should pass a callback to
    invoke when the test is finished running.

    The returned handler will invoke the setup/teardown functions as well as
    the test itself.  Each stage will be run async. 
    
    If you pass a filter and the filter excludes this test, then the return
    value will be null
    
    @param {Hash} filter 
      (Optional) hash of test names and a boolean value to select which to run
      
    @returns {Function} function to invoke when running
  */
  schedule: function(filter) {
    
    // skip if filter is included and this test is not part of it
    if (filter && !filter[this.name]) return null;
    
    var mod     = this.module(),
        setupAction = this._phase(Ct.SETUP_MODE, mod.setup()),
        testAction  = this._phase(Ct.TEST_MODE, this.handler),
        teardownAction = this._phase(Ct.TEARDOWN_MODE, mod.teardown());
        
    var test  = this;
    return function(done) {
      setupAction(function(passed) {
        
        // if setup failed, teardown and then abort
        if (!passed) {
          return teardownAction(function() { done(null, false); });
        }
        
        testAction(function(passed) {
          teardownAction(function(passed2) {
            return done(null, passed && passed2);
          });
        });

      });
    };

  },
  
  // ..........................................................
  // PRIVATE METHODS
  // 

  /**
    @constructor
    
    Set the test name and (optionally) handler and async value.  A test 
    must have a handler to actually run.
    
    @param {String} name
      Human readable description of the test
      
    @param {Function} handler
      A handler to invoke when running the test
    
    @returns {void}
  */
  init: function(name, handler) {
    this.name = this.testName = name; // testName is needed for logging
    if (arguments.length>1) {
      this.handler = handler;
    }
    
    this.tests = [] ; // empty set of tests belonging to this module
  },
  
  toString: function() {
    var mod = this.module();
    mod = (mod && mod.name) ? mod.name : '(unknown module)';
    return utils.fmt("Ct.Test<%@:%@>", mod, this.name);  
  },
  
  /** @private
    Return a handler function to invoke a particlar phase of the test 
    (setup, teardown or the test itself)
  */
  _phase: function(mode, handler) {
    var test = this;
    return function(done) {

      // setup module info...
      var mod = test.module();
      if (mod && mod.moduleContext) mod = mod.moduleContext();
      test.moduleNames = mod || [];

      test.mode = mode;
      test.didFail = false ; 
      test._actualAsserts = 0 ;
      test._expectedAsserts = -1;
      Ct.currentTest = test;

      // invoked when test completes
      var cleanup = function() {
        test._cancelTimeout();
        if (!test.didFail) test._verifyAsserts();
        test.mode = Ct.PLANNING_MODE;
        Ct.currentTest = null;
        
        var passed = !test.didFail;
        test.didFail = false;
        return done(passed);
      };
      
      if (handler) {
        try { 
          handler.call(test.context || test, test, cleanup);

        } catch(e) {
          
          if (e && e.stack) e = e+' '+e.stack; // show backtrace
          test.error(e);
          test.didFail = true;
          cleanup();
        }
      } else return cleanup();
    };
  },
  
  // if test is configured to expect some assertions, test for them.  If the
  // test has already failed for some reason, don't bother since it will 
  // fail anyway
  _verifyAsserts: function() {
    if (this.didFail) return; // nothing to do
    if (this._expectedAsserts>=0) {
      this.equal(this._actualAsserts, this._expectedAsserts, 'expected assertions');
    }
  }
  
});
