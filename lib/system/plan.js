// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================


var utils = require('utils'),
    Promise = require('promise', 'tiki'),
    Ct = require('core');
    
require('system/module'); // add Ct.Module

/**
  Describes a single test.  To run a test must be scheduled as part of a 
  module.  If the test is async then the handler will be passed a promise 
  which is much resolve or cancel for the test run to continue.
*/
Ct.Plan = utils.extend({

  init: function(name) {
    this.name = name;
    this.modules = [];
  },

  // current module being described
  currentModule: null,

  logger: function(newLogger) {
    var ret, DefaultLogger;
    
    if (arguments.length>0) {
      this._logger = newLogger;
      return this;
      
    } else {
      ret = this._logger;
      if (!ret) ret = Ct.logger;
      if (!ret) {
        DefaultLogger = require('loggers/default');
        ret = this._logger = new DefaultLogger(this.name);
      }
      return ret ;
    }
  },
  
  module: function(moduleName, opts) {
    var mod ;
    
    if (utils.T_STRING === typeof moduleName) {
      mod = new Ct.Module(moduleName);
    } else mod = moduleName ;
    
    mod.plan(this);
    this.currentModule = mod;
    this.modules.push(mod);

    if (opts && opts.setup) this.setup(opts.setup);
    if (opts && opts.teardown) this.teardown(opts.teardown);
    return this ;
  },

  _module: function() {
    if (!this.currentModule) this.module('default');
    return this.currentModule;
  },

  setup: function(handler, async) {
    this._module().setup(handler, async);
    return this;
  },

  teardown: function(handler, async) {
    this._module().teardown(handler, async);
    return this;
  },

  test: function(testName, handler, async) {
    this._module().test(testName, handler, async);
    return this;
  },

  schedule: function(pr, filter) {
    
    var modules = this.modules,
        len   = modules.length,
        idx;
        
    if (len<=0) return pr; // nothing to do
    
    pr = pr.then(this, this._begin, this._begin);
    for(idx=0;idx<len;idx++) pr = modules[idx].schedule(pr, filter);
    pr = pr.then(this, this._end, this._end);
    
    return pr;
  },
  
  _begin: function() {
    Ct.runningPlan = this;
    this.logger().planDidBegin(this.name);
  },
  
  _end: function() {
    this.logger().planDidEnd(this.name);
    Ct.runningPlan = null;
  }
  
});
