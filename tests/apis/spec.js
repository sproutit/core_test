// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals describe before after it */
"import core-test:spec";

// /*
//   NOTE: This file verifies the native Qunit API.  It swaps out a dummy 
//   logger then uses the native CoreTest API to verify the results on that 
//   logger.  See apis/core-test.js for more info
// */
var Ct = require('core'), dummy;
require('loggers/dummy'); // adds Ct.DummyLogger    
dummy = new Ct.DummyLogger('dummy');

// ..........................................................
// RUN SIMPLE SET OF TESTS
// 

// Copy basic unit test...

dummy.redirect(); // redirect logging

describe("module without setup/teardown (default)", function() {

  it("should pass a test", function(v) {
    v.expect(1);
    v(true).should.be(true);
  });
  
});

describe("module with setup only", function() {
  
  before(function(v) {
    v(true).should.be(true);
  });
  
  it("should run setup", function(v) {
    v.expect(2);
    v(true).should.be(true);
  });

  describe("nested setup module", function() {
    before(function(v) {
      v(true).should.be(true);
    });
    
    it("should run before both modules", function(v) {
      v.expect(3);
      v(true).should.be(true);
    });
  });
    
});


describe("module with setup and teardown", function() {
  
  before(function(v) {
    v(true).should.be(true);
  });
  
  after(function(v) {
    v(true).should.be(true);
  });
  
  it("should run setup and teardown", function(v) {
    v.expect(3);
    v(true).should.be(true);
  });
  
  describe("nested setup and teardown", function(v) {
    
    before(function(v) {
      v(true).should.be(true);
    });
    
    after(function(v) {
      v(true).should.be(true);
    });
    
    it("should run nested setup and teardowns also", function(v) {
      v.expect(5);
      v(true).should.be(true);
    });
  });
});

// describe("async module", function() {
//   
//   it("should wait until the async test has passed", function(v) {
//     v.async();
//     setTimeout(function() {
//       v(true).should.be(true);
//       v.expect(1);
//       v.done();
//     });
//   });
// });
// 
// describe("this context", function() {
//   before(function(v) {
//     this.foo = 'foo';
//   });
//   
//   after(function(v) {
//     v(this.foo).should.be('foo');
//   });
//   
//   it("should keep 'this' the same for before, after and test", function(v) {
//     v(this.foo).should.be('foo');
//   });
// });



dummy.restore(); // restore old logger

// ..........................................................

// now we can evaluate the result
Ct.module('CommonJS Basic API');

Ct.test('history', function(t) {
  require('sys').debug(require('sys').inspect(dummy.history));
  dummy.expect(t, [undefined,   
    
    // module without setup/teardown (default)
    {
      modules: ['module without setup/teardown (default)'],
      test:    'should pass a test',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module without setup/teardown (default)'],
      test:    'should pass a test',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "expected assertions should be equal (actual = 1, expected = 1)"
    },

    undefined, 

    // module with setup only
    undefined, 
    
    {
      modules: ['module with setup only'],
      test:    'should run setup',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup only'],
      test:    'should run setup',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup only'],
      test:    'should run setup',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "expected assertions should be equal (actual = 2, expected = 2)"
    },

    // nested setup module

    {
      modules: ['module with setup only', 'nested setup module'],
      test:    'should run before both modules',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup only', 'nested setup module'],
      test:    'should run before both modules',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup only', 'nested setup module'],
      test:    'should run before both modules',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup only', 'nested setup module'],
      test:    'should run before both modules',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "expected assertions should be equal (actual = 3, expected = 3)"
    },
    
    undefined, 
    
    // module with setup and teardown
    undefined, 

    {
      modules: ['module with setup and teardown'],
      test:    'should run setup and teardown',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup and teardown'],
      test:    'should run setup and teardown',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup and teardown'],
      test:    'should run setup and teardown',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "expected assertions should be equal (actual = 2, expected = 2)"
    },

    // nested setup and teardown

    {
      modules: ['module with setup and teardown', 'nested setup and teardown'],
      test:    'should run nested setup and teardowns also',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup and teardown', 'nested setup and teardown'],
      test:    'should run nested setup and teardowns also',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup and teardown', 'nested setup and teardown'],
      test:    'should run nested setup and teardowns also',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: " should be equal (actual = true, expected = true)"
    },

    {
      modules: ['module with setup and teardown', 'nested setup and teardown'],
      test:    'should run nested setup and teardowns also',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "expected assertions should be equal (actual = 3, expected = 3)"
    },
    
    null
  ]);
  dummy.reset();
});

Ct.run();

