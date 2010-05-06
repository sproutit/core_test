// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

/*
  NOTE: This file verifies the native CommonJS API.  It swaps out a dummy 
  logger then uses the native CoreTest API to verify the results on that 
  logger.  See apis/core-test.js for more info
*/
var Ct = require('core'), dummy;
require('loggers/dummy'); // adds Ct.DummyLogger    
dummy = new Ct.DummyLogger('dummy');

// import commonJS api
var assert = require('assert');

// ..........................................................
// RUN SIMPLE SET OF TESTS
// 

dummy.redirect(); // redirect logging

var exports = {}; // pretend this is a module

exports.testFoo = function() {
  assert.ok(true, 'foo');
};

exports.testBar = function() {
  assert.equal(true, false, 'bar');
};

// CommonJS requires us to support nesting of modules
exports.testModule = {
  
  testFoo: function() {
    assert.notEqual(true, false, 'foo');
  },
  
  testNested: {
    testBar: function() {
      assert.deepEqual([1,2,3], [1,2,3], 'bar');
    }
  }
};

require('test').run(exports);

dummy.restore(); // restore old logger

// ..........................................................

// now we can evaluate the result
Ct.module('CommonJS Basic API');

Ct.test('history', function(t, done) {
  dummy.expect(t, [
    undefined,
    {
      modules: ['default'],
      test:    'testFoo',
      status:  Ct.PASS,
      mode:    'test',
      message: 'foo (actual = true, expected = true)'
    },

    {
      modules: ['default'],
      test:    'testBar',
      status:  Ct.FAIL,
      mode:    'test',
      message: 'bar should be equal (actual = true, expected = false)' 
    },

    {
      modules: ['default', 'testModule'],
      test:    'testFoo',
      status:  Ct.PASS,
      mode:    'test',
      message: 'foo should not be equal (actual = true, expected = false)'
    },

    {
      modules: ['default', 'testModule', 'testNested'],
      test:    'testBar',
      status:  Ct.PASS,
      mode:    'test',
      message: 'bar should be deep equal (actual = [\n   1,\n   2,\n   3\n], expected = [\n   1,\n   2,\n   3\n])'
    },
    
    null
  ]);
  dummy.reset();
  done();
});

Ct.run();

