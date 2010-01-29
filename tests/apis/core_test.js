// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

/*
  NOTE: This file verifies the native CoreTest API.  To verify the API we swap
  the current logger to point at a dummy logger, then run some tests.  Then
  we restore the original logger and run tests that evaluate the dummy log
  output.  Use this same pattern when adding additional DSLs to core test or
  for your own DSLs
*/
var Ct = require('core'),
    utils = require('utils'),
    dummy;
    
require('loggers/dummy'); // adds Ct.DummyLogger    
dummy = new Ct.DummyLogger('dummy');

// ..........................................................
// API TEST 
// 

dummy.redirect(); // redirect logging

Ct.module('Basic API');
Ct.setup(function(t) {
  t.info('setup');
});

Ct.teardown(function(t) {
  t.info('teardown');
});

Ct.test('test1', function(t) {
  t.ok(true, 'Ct.ok(true)');
});

Ct.run();
dummy.restore(); // restore old logger

// ..........................................................
// EVALUATE RESULTS
// 

// now we can evaluate the result
Ct.module('CoreTest Basic API');

Ct.test('history', function(t) {
  dummy.expect(t, [
    null, // skip begin 
    
    { modules: ['Basic API'],
      test:    'test1',
      mode:    Ct.SETUP_MODE, 
      message: 'setup'
    },

    { modules: ['Basic API'],
      test:    'test1',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS, 
      message: 'Ct.ok(true) (actual = true, expected = true)'
    },

    { modules: ['Basic API'],
      test:    'test1',
      mode:    Ct.TEARDOWN_MODE, 
      message: 'teardown'
    },
    
    null   
  ]);
  dummy.reset();
});

Ct.run();

// ..........................................................
// TEST ASYNC
// 

dummy.redirect();

function now() {
  return new Date().getTime();
}

// try this with setup, teardown, and test
function _delay(msg) {
  return function(t) {
    var pr = utils.Promise.create(),
        cur = now(), later;
    
    setTimeout(function() {
      later = now();
      t.ok((later-cur) >= 100, msg);
      pr.resolve(); // should continue testing
    }, 200);
    
    return pr; // make async
  };
}

Ct.module('Async API');
Ct.setup(_delay('setup'));
Ct.teardown(_delay('teardown'));

Ct.test('test1', _delay('test'));

Ct.run();
dummy.restore();

// ..........................................................
// VERIFY RESULTS
// 

Ct.module('Verify Async API');

Ct.test('history', function(t) {
  dummy.expect(t, [
    null, // skip begin 
    
    { modules: ['Async API'],
      test:    'test1',
      mode:    Ct.SETUP_MODE, 
      status:  Ct.PASS,
      message: 'setup (actual = true, expected = true)'
    },

    { modules: ['Async API'],
      test:    'test1',
      mode:    Ct.TEST_MODE,
      status:  Ct.PASS, 
      message: 'test (actual = true, expected = true)'
    },

    { modules: ['Async API'],
      test:    'test1',
      mode:    Ct.TEARDOWN_MODE, 
      status:  Ct.PASS,
      message: 'teardown (actual = true, expected = true)'
    },
    
    null   
  ]);
  dummy.reset();
});

Ct.run();
