// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals describe before after it */
"use exports describe before after it";

/**
  @file @private
    
  Implements a BDD-style specification API.  Example:
  
  {{{
  
    describe('some part of the app', function() {
    
      before(function() {
        this.foo = 'bar';
      });
      
      after(function() {
        this.foo = null;
      });
      
      it('should do something', function(val) {
        val(this.foo).shouldBe('bar');
      });
      
      describe('a nested part of the app', function() {
        before(function(v) {
          // also sets this.foo = 'bar' before this
          this.bar = 10;
        });
        
        it('should have foo and bar', function(v) {
          v(this.foo).should.not().equal('bar');
          v(this.bar).should.be.greaterThan(5);          
          v.async();
        
          v(23).not().greaterThan(5);
          
          setTimeout(function() {
            v.done();
          });
          
        });
      });
      
    });
  }}}
*/

var Ct    =  require('core'),
    utils = require('utils'),
    fn;

var state = {
  beforeHandlers: [],
  afterHandlers:  [],
  moduleNames: [],
  level: 0
};

function pushState(desc) {
  
  var next = {
    beforeHandlers: state.beforeHandlers.slice(),
    afterHandlers:  state.afterHandlers.slice(),
    moduleNames:    state.moduleNames.slice(),
    tests: [], 
    level: state.level+1,
    prevState: state
  };
  next.moduleNames.push(desc);
  next.module = state.module ? state.module.module(desc) : Ct._defaultPlan().module(desc);
  
  state = next;
}

function popState() {
  if (!state.prevState) {
    throw "cannot popState when at top level";
  }
  state = state.prevState;
}

// Value handles assertions.  we generate a new closure with this.
var Value = function(x, t) {
  this.value = x;
  this.test  = t;

  // sweet sweet sugar
  this.should = this;
};
exports.Value = Value;

function mkval(t, done) {
  var ret = function(x) {
    return new Value(x, t);
  };

  ret.deferred = ret._isDone = false;
  
  /**
    Puts the test into async mode.  You will need to call done() manually
    to complete the test.
  */
  ret.async = function() {
    this.deferred = true;
    return this;
  };
  
  /**
    Call to finish a test.  Not required unless test is in async mode.
  */
  ret.done = function() {
    if (!this._isDone) {
      this._isDone = true;
      done();
    }
    return this;
  };

  /**
    Log an error to the test.
  */
  ret.error = function(msg) {
    t.error(msg);
    return this;
  };
  
  /**
    Log and informative statement to the test.
  */
  ret.info = function(msg) {
    t.info(msg);
    return this;
  };
  
  ret.expect = function(cnt) {
    t.expect(cnt);
    return this;
  };
  
  ret._finish = function() {
    if (!this.deferred && !this._isDone) {
      this._isDone = true;
      done();
    }
  };
  
  return ret;
}

function unroll(handler, t, next, context) {
  return function(err) {
    if (err) return next(err);
    var v = mkval(t, next);
    handler.call(context, v);
    v._finish(); // will invoke next...
  };
}

/**
  Top-level command that describes a currenet condition or state.  You can
  nest calls to describe() but when the top level one exits is when we will
  run the plan.
*/
exports.describe = function describe(desc, handler, context) {
  var loc, next, module;

  // get a new state and start a new module
  pushState(desc);
  
  // register generic setup/teardown handlers
  var beforeHandlers = state.beforeHandlers,
      afterHandlers  = state.afterHandlers;
  
  state.module.setup(function(t, done) {
    loc = beforeHandlers.length;
    next = done;
    while(--loc>=0) next = unroll(beforeHandlers[loc], t, next, this);
    next();
  });

  state.module.teardown(function(t, done) {
    loc = afterHandlers.length;
    next = done;
    while(--loc>=0) next = unroll(afterHandlers[loc], t, next, this);
    next();
  });

  // now invoke handler.  this will schedule tests or add before/after
  handler.call(context);
  
  popState();
  if (state.level === 0) Ct.run();
};

exports.before = function before(func) {
  state.beforeHandlers.push(func);
};

exports.after = function after(func) {
  state.afterHandlers.push(func);
};

// schedule a test in the current target module
exports.it = function it(desc, func) {
  if (!state.module) throw "cannot schedule test outside of context";
  state.module.test(desc, function(t, done) {
    var v = mkval(t, done);
    func.call(this, v);
    v._finish();
  });
};

// ..........................................................
// ASSERTIONS
// 

// assertion functions go here
fn = exports.describe.fn = Value.prototype;

/**
  Inverts the next assertion.
*/
fn.not = function() {
  this.inverted = !this.inverted;
  return this;
};

/**
  Assertion primitive
*/
fn.assert = function(pass, message, actual, expected) {
  if (this.inverted) {
    pass = !pass;
    message = 'should not be'+message;
  } else message = 'should be'+message;
  this.test.assert(pass, message, actual, expected);
  return this;
};

/**
  Assert the passed value should be equal.
*/
fn.equal = function(expected, message) {
  if (this.inverted) {
    this.test.notEqual(this.value, expected, message);
  } else {
    this.test.equal(this.value, expected, message);
  }
  return this;
};
fn.equals = fn.be = fn.equal;

/**
  Assert the passed value should be same (with deep compare)
*/
fn.same = function(expected, message) {
  if (this.inverted) {
    this.test.notDeepEqual(this.value, expected, message);
  } else {
    this.test.deepEqual(this.value, expected, message);
  }
  return this;
};
fn.deepEqual = fn.beSame = fn.same;

/**
  Assert that is exact same value
*/
fn.identical = function(expected, message) {
  if (this.inverted) {
    this.test.notStrictEqual(this.value, expected, message);
  } else {
    this.test.strictEqual(this.value, expected, message);
  }
};
fn.strictEqual = fn.beIdentical = fn.identical;

fn.empty = function() {
  var v = this.value,
      isEmpty = (v===null) || (v===undefined) || (v.length === 0) || (v==='');
  this.assert(isEmpty, 'empty', this.value, '');
  return this;
};
fn.beEmpty = fn.empty;

fn.contain = function(item) {
  this.assert(this.value.indexOf(item)>=0, 'contain item', this.value, item);
  return this;
};








