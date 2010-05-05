// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals describe before after it val */
"use exports describe before after it";

/**
  @file @private
  
  UNFINISHED -
  
  Implements a BDD-style specification API.  Example:
  
  {{{
  
    describe('some part of the app', function() {
    
      before(function() {
        this.foo = 'bar';
      });
      
      after(function() {
        this.foo = null;
      });
      
      it('should do something', function() {
        val(this.foo).shouldBe('bar');
      });
      
      describe('a nested part of the app', function() {
        before(function(v) {
          // also sets this.foo = 'bar' before this
          this.bar = 10;
        });
        
        it('should have foo and bar', function(v) {
          v(this.foo).shouldBe('bar');
          v(this.bar).greaterThan(5);          
          v.defer();
          
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
    valueOf;

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
  this.currentTest = t;
};
exports.Value = Value;

// assertion functions go here
describe.fn = Value.prototype;

function mkval(t, done) {
  var ret = function(x) {
    return new Value(x, t);
  };
  ret.defer = function() {
    this.deferred = true;
    return this;
  };
  
  ret.done = function() {
    if (this.deferred && !this._notified) {
      this._notified = true;
      done();
    }
    return this;
  };
  
  ret.deferred = false;
  ret._notified = false;
  ret._finish = function() {
    if (!this.deferred && !this._notified) done();
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
  var loc, next;
  
  pushState(desc);
  handler.call(context); // handler will schedule tests/before/after
  
  // now emit actual Ct tests.
  Ct.module(state.moduleNames.join(' :: '));

  var beforeHandlers = state.beforeHandlers,
      afterHandlers  = state.afterHandlers;
  
  if (beforeHandlers.length > 0) {
    Ct.setup(function(t, done) {
      loc = beforeHandlers.length;
      next = done;
      while(--loc>=0) next = unroll(beforeHandlers[loc], t, next, context);
      next();
    });
  }

  if (afterHandlers.length > 0) {
    Ct.setup(function(t, done) {
      loc = afterHandlers.length;
      next = done;
      while(--loc>=0) next = unroll(afterHandlers[loc], t, next, context);
      next();
    });
  }

  var tests = state.tests;
  tests.forEach(function(t) {
    Ct.test(t.desc, function(t, done) {
      var v = mkval(t, done);
      t.func.call(context, v);
      v._finish();
    });
  });
  
  popState();
  if (state.level === 0) Ct.done();
};


exports.before = function before(func) {
  state.beforeHandlers.push(func);
};

exports.after = function after(func) {
  state.afterHandlers.push(func);
};

exports.it = function it(desc, func) {
  state.tests.push({ desc: desc, func: func });
};


// inverted: false,
// 
// explain: function(pass, verb, expected) {
//   var actual = Ct.dump(this.val);
//   expected   = Ct.dump(actual);
// 
//   if (this.inverted) {
//     pass = !pass;
//     verb = 'not ' + verb;
//   }
//   var msg = utils.fmt('%@ should %@ %@', expected, verb, actual);
//   
//   Ct.assertion(pass, msg);
//   return this;
// },

// linker - valueOf('foo').should().be('foo');
// 
// shouldBe: function(val) {
//   this.inverted = false;
//   if (arguments.length===0) return this;
//   else return this._shouldBe(val);
// },
// 
// _shouldBe: function(val) {
//   var v = this.val;
//   if (val===Ct.EMPTY) v = v && (v.length!==undefined) && v.length===0;
//   else if (val===true) v = !!v;
//   else if (val===false) v = !v;
//   else v = (v === val);
// 
//   return this.explain(v, 'be', val);
// },
// 
// shouldNotBe: function(val) {
//   this.inverted = true;
//   if (arguments.length===0) return this;
//   else return this._shouldBe(val);
// },
// 
// shouldBeTrue: function() {
//   return this._shouldBe(true);
// },
// 
// shouldBeFalse: function() {
//   return this._shouldBe(false);
// },
// 
// shouldBeEmpty: function() {
//   return this._shouldBe(Ct.EMPTY);
// },
// 
// shouldBeNull: function() {
//   return this.shouldBe(null);
// },
// 
// shouldNotBeNull: function() {
//   return this.shouldNotBe(null);
// },
// 
// shouldBeUndefined: function() {
//   return this.shouldBe(undefined);
// },
// 
// shouldNotBeUndefined: function() {
//   return this.shouldNotBe(undefined);
// },
// 
// shouldBeSame: function(val) {
//   
// },
// 
// shouldNotBeSame: function(val) {
//   
// },
// 
// shouldHave: function(len) {
//   
// },
// 
// shouldInclude: function(item) {
//   this.inverted = false;
//   return this.include(item);
// },
// 
// shouldNotInclude: function(item) {
//   this.inverted = true;
//   return this.include(item);
// },
// 
// include: function(item) {
//   
// },
// 
// shouldMatch: function(regex) {
//   
// },
// 
// shouldNotMatch: function(regex) {
//   
// },
// 
// shouldFail: function() {
//   
// }
