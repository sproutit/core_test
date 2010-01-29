// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct = require('core'),
    utils = require('utils'),
    logger, plan, module, test;

require('loggers/dummy'); // adds Ct.DummyLogger    
require('system/test'); // adds Ct.Test;
require('system/module'); // adds Ct.Module;
require('system/plan'); // adds Ct.Plan

Ct.module('Ct.Test.schedule');
Ct.setup(function() {
  logger = new Ct.DummyLogger();
  plan   = new Ct.Plan('plan').logger(logger);
  module = new Ct.Module('module');
  
  // hook up
  plan.module(module);
});

Ct.teardown(function() {
  logger = plan = module = test = null;
});

// ..........................................................
// BASIC TESTS
// 

Ct.test('scheduling a test, no filters', function(t) {

  test = new Ct.Test('foo', function(t) {
    t.assert(true, 'bar');
  });
  module.test(test);
  
  var first = utils.Promise.create(),
      last  = test.schedule(first);

  t.notEqual(last, first, 'promise returned from schedule should not equal promise passed in');
  
  first.resolve(); // should execute test
  
  var item  = logger.find({ mode: Ct.TEST_MODE });
  t.ok(item, 'logger should have an item in history');
  t.equal(item.message, 'bar', 'logged msg');
});

Ct.test('scheduling a test with filters', function(t) {

  test = new Ct.Test('foo', function(t) {
    t.assert(true, 'bar');
  });
  module.test(test);
  
  var first = utils.Promise.create(), last;

  // try to schedule with foo filtered out
  last  = test.schedule(first, { 'foo': false });
  t.equal(last, first, 'should return same promise as passed in when filtered out');
  first.resolve();
  t.equal(logger.history.length, 0, 'history should be empty after resolving first');

  first = utils.Promise.create();
  last  = test.schedule(first, { 'foo': true });
  t.notEqual(last, first, 'promise returned from schedule should not equal promise passed in');
  
  first.resolve(); // should execute test
  
  var item  = logger.find({ mode: Ct.TEST_MODE });
  t.ok(item, 'logger should have an item in history');
  t.equal(item.message, 'bar', 'logged msg');
});


// ..........................................................
// SCHEDULING WITH SETUP/TEARDOWN
// 

var setupAssert, teardownAssert, testAssert,
    setupThrows, testThrows, teardownThrows,
    test2;
    
Ct.module('Ct.Test.schedule setup/teardown');
Ct.setup(function() {
  logger = new Ct.DummyLogger();
  plan   = new Ct.Plan('plan').logger(logger);
  module = new Ct.Module('module');

  module.setup(function(x) {
    x.assert(setupAssert, 'setup');
    if (setupThrows) throw "setup throws";
  });
  
  module.teardown(function(x) {
    x.assert(teardownAssert, 'teardown');
    if (teardownThrows) throw 'teardown throws';
  });

  test = new Ct.Test('test', function(x) {
    x.assert(testAssert, 'test');
    if (testThrows) throw "test throws";
  });

  test2 = new Ct.Test('test2', function(x) {
    x.assert(true, 'test2');
  });
  
  module.test(test);
  module.test(test2);

  setupAssert = teardownAssert = testAssert = true;
  setupThrows = teardownThrows = testThrows = false;
  
  // hook up
  plan.module(module);
});

Ct.teardown(function() {
  logger = plan = module = test = null;
});

function validateLogger(t, shouldHaveSetup, shouldHaveTest, shouldHaveTeardown) {
  var item ;

  var first = utils.Promise.create(),
      last  = test.schedule(first);

  t.notEqual(last, first, 'promise returned from schedule should not equal promise passed in');
  
  // add test2 as well to run after test
  last = test2.schedule(last);
  
  first.resolve(); // should execute test

  item  = logger.find({ mode: Ct.SETUP_MODE, test: 'test', message: 'setup' });
  if (shouldHaveSetup) {
    t.ok(item, 'logger should have setup in history');
  } else {
    t.equal(item, null, 'logger should not have setup in history');
  }

  item  = logger.find({ mode: Ct.TEARDOWN_MODE, test: 'test', message: 'teardown' });
  if (shouldHaveTeardown) {
    t.ok(item, 'logger should have teardown in history');
  } else {
    t.equal(item, null, 'logger should not have teardown in history');
  }
  
  item  = logger.find({ mode: Ct.TEST_MODE, test: 'test', message: 'test' });
  if (shouldHaveTest) {
    t.ok(item, 'logger should have an item in history');
  } else {
    t.equal(item, null, 'logger should not have test in history');
  }
  
  // make sure test2 setup ALWAYS runs
  item  = logger.find({ mode: Ct.SETUP_MODE, test: 'test2', message: 'setup' });
  t.ok(item, 'logger should have test2 item in history');
  
}

Ct.test('scheduling a test with setup/teardown', function(t) {
  validateLogger(t, true, true, true);
});

Ct.test('scheduling a test with failing setup', function(t) {
  setupAssert = false;
  validateLogger(t, true, false, true); // should still run teardown
});

Ct.test('scheduling a test with setup exception', function(t) {
  setupThrows = true ;
  validateLogger(t, true, false, true); // should still run teardown
});

Ct.test('scheduling a test with test failure', function(t) {
  testAssert = false ;
  validateLogger(t, true, true, true); // should still run teardown
});

Ct.test('scheduling a test with test exception', function(t) {
  testAssert = false ;
  validateLogger(t, true, true, true); // should still run teardown
});

Ct.test('scheduling a test with teardown assertion', function(t) {
  teardownAssert = true ;
  validateLogger(t, true, true, true); // should still run teardown
});

Ct.test('scheduling a test with teardown exception', function(t) {
  teardownThrows = true ;
  validateLogger(t, true, true, true); // should still run teardown
});

// ..........................................................
// SPECIAL CASES
// 

Ct.run();

