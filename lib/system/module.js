// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================


var utils = require('utils'),
    Ct = require('core');

require('system/test'); // add Ct.Test

/**
  Describes a single test module.  A test module contains an array of tests 
  which can be scheduled in the overall plan.  It may also contain a setup
  and teardown function to run before/after each test.
*/
Ct.Module = utils.extend({
  
  name: null,
  
  init: function(name) {
    this.name = name;
    this.tasks = [] ; // empty set of tests belonging to this module
  },
  
  /**
    The plan that owns the current module.   Set when you add the module to
    the plan.
  */
  plan: function(plan) {
    if (arguments.length===0) return this._plan;
    this._plan = plan;
    return this;
  },
  
  /**
    Set or get the current setup handler for the module.
  */
  setup: function(handler, async) {
    if (arguments.length===0) return this._setup;
    this._setup = handler;
    this.setupAsync = async || false;
    return this;
  },
  
  /**
    Set or get the current teardown handler for the module
  */
  teardown: function(handler, async) {
    if (arguments.length===0) return this._teardown;
    this._teardown = handler;
    this.teardownAsync = async || false;
    return this;
  },
  
  /**
    Add a new test to the module.  If you pass just a function, this will
    create a new Ct.Test object to contain it.  The second parameter will 
    decide if the test should be async.
  */
  test: function(testName, handler, async) {
    if (typeof testName === utils.T_STRING) {
      testName = new Ct.Test(testName, handler, async);
    }
    testName.module(this);
    this.tasks.push(testName);
  },
  
  /**
    Schedules all the tests in the current module by attaching to the passed
    promise.  Returns a new promise that should form the room of the plan
    schedule.
  */
  schedule: function(pr, filter) {
    
    // skip if a filter is applied and this module is not included
    if (filter && !filter[this.name]) return pr; 
    else if (filter) filter = filter[this.name];

    var tasks = this.tasks,
        len   = tasks.length,
        idx;
    for(idx=0;idx<len;idx++) pr = tasks[idx].schedule(pr, filter);
    return pr;
  }
  
});
