// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

"import core-test:qunit";

/*
  NOTE: This file verifies the native Qunit API.  It swaps out a dummy 
  logger then uses the native CoreTest API to verify the results on that 
  logger.  See apis/core-test.js for more info
*/
var Ct = require('core'), dummy;
require('loggers/dummy'); // adds Ct.DummyLogger    
dummy = new Ct.DummyLogger('dummy');

// ..........................................................
// RUN SIMPLE SET OF TESTS
// 

// Copy basic unit test...

dummy.redirect(); // redirect logging

test("module without setup/teardown (default)", function() {
 expect(1);
 ok(true);
});

module("setup test", {
 setup: function() {
   ok(true);
 }
});

test("module with setup", function() {
 expect(2);
 ok(true);
});

module("setup/teardown test", {
 setup: function() {
   this.fail = true;
   ok(true);
 },
 teardown: function() {
   delete this.fail;
   ok(true);
 }
});

test("module with setup/teardown", function() {
 expect(3);
 ok(true);
});

module("setup/teardown test 2");

test("module without setup/teardown", function() {
 expect(1);
 ok(true);
});

var state;

module("teardown and stop", {
 teardown: function() {
   ok(state == "done");
 }
});

test("teardown must be called after test ended", function() {
 
 expect(1);
 stop();
 setTimeout(function() {
   state = "done";
   start();
 }, 0);
});

module("save scope", {
 setup: function() {
   this.foo = "bar";
 },
 teardown: function() {
   same(this.foo, "bar");
 }
});

test("scope check", function() {
 expect(2);
 same(this.foo, "bar");
});

Ct.run();

dummy.restore(); // restore old logger

// ..........................................................

// now we can evaluate the result
Ct.module('CommonJS Basic API');

Ct.test('history', function(t, done) {  
  dummy.expect(t, [undefined,

    // for module without setup/teardown (default)
    {
      modules: ['default'],
      test:    'module without setup/teardown (default)',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },
    
    {
      modules: ['default'],
      test:    'module without setup/teardown (default)',
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 1, expected = 1)'
    },

    // module with setup
    {
      modules: ['setup test'],
      test:    'module with setup',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },

    {
      modules: ['setup test'],
      test:    'module with setup',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },
    
    {
      modules: ['setup test'],
      test:    'module with setup', 
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 2, expected = 2)'
    },

    // setup/teardown test
    
    {
      modules: ['setup/teardown test'],
      test:    'module with setup/teardown',
      mode:    Ct.SETUP_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },

    {
      modules: ['setup/teardown test'],
      test:    'module with setup/teardown',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },

    {
      modules: ['setup/teardown test'],
      test:    'module with setup/teardown',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },
    
    {
      modules: ['setup/teardown test'],
      test:    'module with setup/teardown', 
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 3, expected = 3)'
    },
    
    // setup/teardown test 2
    {
      modules: ['setup/teardown test 2'],
      test:    'module without setup/teardown',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },
    
    {
      modules: ['setup/teardown test 2'],
      test:    'module without setup/teardown',
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 1, expected = 1)'
    },

    // teardown and stop
    {
      modules: ['teardown and stop'],
      test:    'teardown must be called after test ended',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "ok (actual = true, expected = true)"
    },
    
    {
      modules: ['teardown and stop'],
      test:    'teardown must be called after test ended',
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 1, expected = 1)'
    },
    
    // save scope
    {
      modules: ['save scope'],
      test:    'scope check',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS,
      message: "same should be deep equal (actual = bar, expected = bar)"
    },

    {
      modules: ['save scope'],
      test:    'scope check',
      mode:    Ct.TEARDOWN_MODE,
      status:  Ct.PASS,
      message: "same should be deep equal (actual = bar, expected = bar)"
    },
    
    {
      modules: ['save scope'],
      test:    'scope check',
      status:  Ct.PASS,
      message: 'expected assertions should be equal (actual = 2, expected = 2)'
    },
    
    null
  ]);
  dummy.reset();
  done();
});

Ct.run();

