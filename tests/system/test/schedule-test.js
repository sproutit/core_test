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
Ct.setup(function(t, done) {
  logger = new Ct.DummyLogger();
  plan   = new Ct.Plan('plan').logger(logger);
  module = new Ct.Module('module');
  
  // hook up
  plan.module(module);
  done();
});

Ct.teardown(function(t, done) {
  logger = plan = module = test = null;
  done();
});

// ..........................................................
// BASIC TESTS
// 

Ct.test('scheduling a test, no filters', function(t, done) {

  test = new Ct.Test('foo', function(t, done) {
    t.assert(true, 'bar');
    done();
  });
  module.test(test);
  
  var func  = test.schedule();

  t.ok(func, 'test.schedule() should return a function');

  func(function(err) {
    var item  = logger.find({ mode: Ct.TEST_MODE });
    t.ok(!err, 'should not return an error');
    t.ok(item, 'logger should have an item in history');
    t.equal(item.message, 'bar', 'logged msg');
    done();
  });
  
});

Ct.test('scheduling a test with filters', function(t, done) {

  test = new Ct.Test('foo', function(t, done) {
    t.assert(true, 'bar');
    return done();
  });
  module.test(test);
  
  var func;

  // try to schedule with foo filtered out
  func  = test.schedule({ 'foo': false });
  t.ok(!func, 'should return null');

  func  = test.schedule({ 'foo': true });
  t.ok(func, 'return return a function for test');

  func(function() {
    var item  = logger.find({ mode: Ct.TEST_MODE });
    t.ok(item, 'logger should have an item in history');
    t.equal(item.message, 'bar', 'logged msg');
    done();
  });
  
});


// ..........................................................
// SCHEDULING WITH SETUP/TEARDOWN
// 

var setupAssert, teardownAssert, testAssert,
    setupThrows, testThrows, teardownThrows,
    test2;
    
Ct.module('Ct.Test.schedule setup/teardown');
Ct.setup(function(t, done) {
  logger = new Ct.DummyLogger();
  plan   = new Ct.Plan('plan').logger(logger);
  module = new Ct.Module('module');

  module.setup(function(x, done) {
    x.assert(setupAssert, 'setup');
    if (setupThrows) throw "setup throws";
    done();
  });
  
  module.teardown(function(x, done) {
    x.assert(teardownAssert, 'teardown');
    if (teardownThrows) throw 'teardown throws';
    done();
  });

  test = new Ct.Test('test', function(x, done) {
    x.assert(testAssert, 'test');
    if (testThrows) throw "test throws";
    done();
  });

  test2 = new Ct.Test('test2', function(x, done) {
    x.assert(true, 'test2');
    done();
  });
  
  module.test(test);
  module.test(test2);

  setupAssert = teardownAssert = testAssert = true;
  setupThrows = teardownThrows = testThrows = false;
  
  // hook up
  plan.module(module);
  done();
});

Ct.teardown(function(t, done) {
  logger = plan = module = test = null;
  done();
});

function validateLogger(t, shouldHaveSetup, shouldHaveTest, shouldHaveTeardown, done) {
  var item ;

  var func  = test.schedule();

  t.ok(func, 'should return a function to invoke');

  func(function() {
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
    done();
  });
  
}

Ct.test('scheduling a test with setup/teardown', function(t, done) {
  validateLogger(t, true, true, true, done);
});

Ct.test('scheduling a test with failing setup', function(t, done) {
  setupAssert = false;
  validateLogger(t, true, false, true, done); // should still run teardown
});

Ct.test('scheduling a test with setup exception', function(t, done) {
  setupThrows = true ;
  validateLogger(t, true, false, true, done); // should still run teardown
});

Ct.test('scheduling a test with test failure', function(t, done) {
  testAssert = false ;
  validateLogger(t, true, true, true, done); // should still run teardown
});

Ct.test('scheduling a test with test exception', function(t, done) {
  testAssert = false ;
  validateLogger(t, true, true, true, done); // should still run teardown
});

Ct.test('scheduling a test with teardown assertion', function(t, done) {
  teardownAssert = true ;
  validateLogger(t, true, true, true, done); // should still run teardown
});

Ct.test('scheduling a test with teardown exception', function(t, done) {
  teardownThrows = true ;
  validateLogger(t, true, true, true, done); // should still run teardown
});

// ..........................................................
// SPECIAL CASES
// 

Ct.run();

