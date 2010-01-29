// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct = require('core'),
    utils = require('utils'),
    logger, plan, module, test, first, last;

require('loggers/dummy'); // adds Ct.DummyLogger    
require('system/test'); // adds Ct.Test;
require('system/module'); // adds Ct.Module;
require('system/plan'); // adds Ct.Plan

Ct.module('Ct.Test async');
Ct.setup(function() {
  logger = new Ct.DummyLogger();
  plan   = new Ct.Plan('plan').logger(logger);
  module = new Ct.Module('module');
  plan.module(module);
  first = utils.Promise.create(); // to run tests
});

Ct.teardown(function() {
  logger = plan = module = test = null;
  first = null;
});


Ct.test('basic async test', function(t) {
  
  var testPromise ;
  
  module.test('async test', function(t2) {
    t2.assert(true, 'test1');
    testPromise = utils.Promise.create(); // save to later resolution
    return testPromise; // makes the test async!
  });
  
  module.test('non-async test', function(t2) {
    t2.assert(true, 'test2'); 
  });
  
  // run test plan.
  plan.schedule(first);
  first.resolve();
  
  // since this is async, the first test should not finish until we resolve
  // the promise.
  t.ok(logger.find({ mode: Ct.TEST_MODE, message: 'test1' }), 'should have log from first test before resolving');
  t.ok(!logger.find({ mode: Ct.TEST_MODE, message: 'test2' }), 'should not have log from follow up test before resolving');
  t.ok(testPromise, 'should have saved a test promise');
  
  // resolve promise - should continue test running
  testPromise.resolve();
  t.ok(logger.find({ mode: Ct.TEST_MODE, message: 'test2' }), 'should have log from followup test');
  
});

Ct.run();

