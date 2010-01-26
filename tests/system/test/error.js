// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct = require('core'),
    logger, test;

require('loggers/dummy'); // adds Ct.DummyLogger    
require('system/test'); // adds Ct.Test;

Ct.module('Ct.Test.error');
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
    test.error('foo');
  });
});

Ct.test('calling with a string', function(t) {
  test.mode = Ct.TEST_MODE;
  test.error('message');
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.ERROR, 'item.status');
  t.equal(item.message, 'message', 'item.message');
});

Ct.test('calling with an error', function(t) {
  test.mode = Ct.TEST_MODE;
  test.error(new Error('message'));
  
  var item = logger.find({ kind: logger.TEST });
  t.equal(item.status, Ct.ERROR, 'item.status');
  t.equal(item.message, 'Error: message', 'item.message');
});


// ..........................................................
// SPECIAL CASES
// 

Ct.run();