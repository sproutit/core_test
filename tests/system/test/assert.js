// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct = require('core'),
    logger, test;

require('loggers/dummy'); // adds Ct.DummyLogger    
require('system/test'); // adds Ct.Test;

Ct.module('Ct.Test.assert');
Ct.setup(function() {
  logger = new Ct.DummyLogger();
  test   = new Ct.Test('testme!');
  test.logger = function() { return logger; };
});

Ct.teardown(function() {
  logger = test = null;
});

// ..........................................................
// BASIC TESTS
// 

Ct.test('calling outside of a test', function(t) {
  t.throws(function() {
    test.assert(true, 'a basic test!');
  });
});

Ct.test('passing assertion with no values', function(t) {
  test.mode = Ct.TEST_MODE;
  test.assert(true, 'message');
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.OK, 'item.status');
  t.equal(item.message, 'message', 'item.message');
  t.equal(item.mode, Ct.TEST_MODE, 'item.mode');
});

Ct.test('passing assertion with values', function(t) {
  test.mode = Ct.TEST_MODE;
  test.assert(true, 'message', 'foo', 'bar');
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.OK, 'item.status');
  t.equal(item.message, 'message (actual = foo, expected = bar)', 'item.message');
  t.equal(item.mode, Ct.TEST_MODE, 'item.mode');
});

Ct.test('failed assertion with no values', function(t) {
  test.mode = Ct.TEST_MODE;
  test.assert(false, 'message');
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.FAIL, 'item.status');
  t.equal(item.message, 'message', 'item.message');
  t.equal(item.mode, Ct.TEST_MODE, 'item.mode');
});

Ct.test('failed assertion with values', function(t) {
  test.mode = Ct.TEST_MODE;
  test.assert(false, 'message', 'foo', 'bar');
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.FAIL, 'item.status');
  t.equal(item.message, 'message (actual = foo, expected = bar)', 'item.message');
  t.equal(item.mode, Ct.TEST_MODE, 'item.mode');
});


// ..........................................................
// SPECIAL CASES
// 

Ct.run();