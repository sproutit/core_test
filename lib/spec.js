// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

"use exports valueOf EMPTY";

var Ct    =  require('core'),
    utils = require('utils'),
    valueOf;

require('system/dump');
    
// root handler for the tdd model.  returns a new assertion object
valueOf = function(val) {
  var ret = utils.beget(valueOf.fn);
  ret.val = val;
  return ret ;
};

// object meaning 'empty' - make an array so it is a unique instance
exports.EMPTY = Ct.EMPTY = ['EMPTY'];

// comparison functions go here
valueOf.fn = {

  inverted: false,
  
  explain: function(pass, verb, expected) {
    var actual = Ct.dump(this.val);
    expected   = Ct.dump(actual);

    if (this.inverted) {
      pass = !pass;
      verb = 'not ' + verb;
    }
    var msg = utils.fmt('%@ should %@ %@', expected, verb, actual);
    
    Ct.assertion(pass, msg);
    return this;
  },
  
  // linker - valueOf('foo').should().be('foo');
  
  shouldBe: function(val) {
    this.inverted = false;
    if (arguments.length===0) return this;
    else return this._shouldBe(val);
  },
  
  _shouldBe: function(val) {
    var v = this.val;
    if (val===Ct.EMPTY) v = v && (v.length!==undefined) && v.length===0;
    else if (val===true) v = !!v;
    else if (val===false) v = !v;
    else v = (v === val);

    return this.explain(v, 'be', val);
  },

  shouldNotBe: function(val) {
    this.inverted = true;
    if (arguments.length===0) return this;
    else return this._shouldBe(val);
  },

  shouldBeTrue: function() {
    return this._shouldBe(true);
  },

  shouldBeFalse: function() {
    return this._shouldBe(false);
  },
  
  shouldBeEmpty: function() {
    return this._shouldBe(Ct.EMPTY);
  },
  
  shouldBeNull: function() {
    return this.shouldBe(null);
  },
  
  shouldNotBeNull: function() {
    return this.shouldNotBe(null);
  },
  
  shouldBeUndefined: function() {
    return this.shouldBe(undefined);
  },
  
  shouldNotBeUndefined: function() {
    return this.shouldNotBe(undefined);
  },
  
  shouldBeSame: function(val) {
    
  },
  
  shouldNotBeSame: function(val) {
    
  },
  
  shouldHave: function(len) {
    
  },
  
  shouldInclude: function(item) {
    this.inverted = false;
    return this.include(item);
  },
  
  shouldNotInclude: function(item) {
    this.inverted = true;
    return this.include(item);
  },
  
  include: function(item) {
    
  },
  
  shouldMatch: function(regex) {
    
  },
  
  shouldNotMatch: function(regex) {
    
  },
  
  shouldFail: function() {
    
  }
  
};



exports = module.exports = valueOf;
exports.valueOf = valueOf;