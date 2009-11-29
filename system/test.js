// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals run typeOf T_FUNCTION T_OBJECT T_HASH A PLATFORM_PACKAGE */

"import package tiki";
"import package tiki/system";
"import tiki/system:core core";
"export run";

var timer = require(PLATFORM_PACKAGE).timer;

function _beginGroup(logger, moduleName) {
  if (moduleName && logger) {
    if (logger.moduleDidBegin) logger.moduleDidBegin(moduleName);
    else if (logger.group) logger.group(moduleName);
  }
  
  return true;
}

function _runTest(tests, testName, testFunc, logger) {
  var inGroup = testName && logger;
    
  if (inGroup) {
    if (logger.testDidBegin) logger.testDidBegin(testName);
    else if (logger.group) logger.group(testName);
  }

  // save the core test logger...
  var oldLogger = CoreTest.logger;
  CoreTest.logger = logger;
  
  try {
    testFunc.call(tests, testName);
  } catch(e) {
    CoreTest.logger = oldLogger;
    if (logger) logger.error(e);
  }
  
  CoreTest.logger = oldLogger;
  
  if (inGroup) {
    if (logger.testDidEnd) logger.testDidEnd(testName);
    else if (logger.groupEnd) logger.groupEnd(testName);
  }
}

function _endGroup(logger, moduleName) {
  if (logger.moduleDidEnd) logger.moduleDidEnd(moduleName);
  else if (logger.groupEnd) logger.groupEnd(moduleName);
}

function _beginPlan(logger, plan) {
  if (logger.planDidBegin) logger.planDidBegin(plan);
  else logger.info("Beginning plan: %@".fmt(plan ? plan.id : '(unknown)'));
}

function _endPlan(logger, plan) {
  if (logger.planDidBegin) logger.planDidEnd(plan);
  else logger.info("Ending plan: %@".fmt(plan ? plan.id : '(unknown)'));
}

var queue = [];

function _queue(func, arg1, arg2) {
  queue.push({ 
    func: func, 
    args: A(arguments).slice(1) 
  }); 
}

var scheduled = false;

function _flush() {
  scheduled = false;
  var start = new Date().getTime(),
      opts;
  while(((new Date().getTime() - start) < 100) && (opts = queue.shift())) {
    if (opts) opts.func.apply(this, opts.args);
  }
  if (queue.length>0) _schedule();
}

function _schedule() {
  if (!scheduled) {
    scheduled = true;
    timer.schedule(0, _flush);
  }
}

/**
  Runs any tests defined in the passed array of unit tests.  Optionally pass
  a logger as a second argument which will be used to output the test.
  
  @param {Hash} tests tests to run. looks for any item beginning with 'test'
  @param {Logger} logger optional logger to use for output
  @param {String} moduleName optional moduleName to use when grouping tests
  @returns {void}
*/
run = function run(tests, logger, moduleName) {
  var prevLogger, key, value, inGroup = false;
  
  prevLogger = CoreTest.logger;
  
  if (!logger) {
    if (require('system').PLATFORM === 'classic') {
      logger = require('browser/logger').logger;
    } else logger = require('system').console;
  }

  CoreTest.logger = logger;
  
  _queue(_beginPlan, logger, tests);
  
  for(key in tests) {
    if (!tests.hasOwnProperty(key)) continue;
    if (key.indexOf('test') !== 0) continue ;

    value = tests[key];
    switch(typeOf(value)) {
      case T_FUNCTION:
        if (!inGroup) {
          inGroup = true;
          _queue(_beginGroup, logger, moduleName);
        }
        
        _queue(_runTest, tests, key, value, logger);
        break;
        
      case T_HASH:
      case T_OBJECT:
        if (!inGroup) {
          inGroup = true; 
          _queue(_beginGroup, logger, moduleName);
        }
        
        run(value, logger, key.slice(4));
        break;
    }
  }
  
  if (inGroup) _queue(_endGroup, logger, moduleName);
  _queue(_endPlan, logger, tests);
  
  _schedule();  
  CoreTest.logger = prevLogger;
};

CoreTest.run = run; // preferred way to access this
