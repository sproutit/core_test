// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var utils = require('utils'),
    Ct    = require('core'),
    $     = require('private/jquery');
    
require('loggers/default'); // add Ct.DefaultLogger

var textDiv, textNode;    

// convert a string into HTML-escaped text.
function _text(str) {
  if (!textNode) textNode = document.createTextNode('');
  if (!textDiv) {
    textDiv = document.createElement('div');
    textDiv.appendChild(textNode);
  }
  
  textNode.nodeValue = str;
  return textDiv.innerHTML.toString().replace(/\n/g, '<br>');
}

// knows how to emit a single assertion
var AssertionEntry = utils.extend({
  init: function(owner, status, message) {
    this.owner   = owner;
    this.message = message;
    this.status  = status;
  },
  
  // expects status, message
  template: '<li class="assertion %@1"><span class="name">%@2</span><span class="status">%@1</span></li>',
  
  emit: function() {
    return utils.fmt(this.template, _text(this.status), _text(this.message));
  }

});

// knows how to emit a single test (along with its assertions)
var TestEntry = utils.extend({
  init: function(owner, testName) {
    this.owner = owner;
    this.name  = testName;
    this.assertions = [];
    this.status = { passed: 0, failed: 0, errors: 0, warnings: 0 };
  },
  
  // add an assertion to the log - also updates stats on the assertion
  add: function(status, message) {
    var entry = new AssertionEntry(this, status, message);
    this.assertions.push(entry);
    if (this.status[status] !== undefined) this.status[status]++;
    if (this.plan()[status] !== undefined) this.plan()[status]++;
    this.owner.pass(status === 'passed');
    this.plan().assertions++;
    
    return entry ;
  },
  
  plan: function() { return this.owner.plan(); },
  
  
  // expects status, name, assertions, passed, failed, errors, warnings
  template: ['<li class="test %@1">',
    '<span class="name">%@2</span>',
    '<span class="status">',
      '<span class="passed">%@4</span>',
      '<span class="warnings">%@7</span>',
      '<span class="failed">%@5</span>',
      '<span class="errors">%@6</span>',
    '</span>',
    '<ul>%@3</ul>',
  '</li>'].join(''),
  
  // emits the result
  emit: function() {
    var statsum = [], 
        status  = this.status, 
        assertions = [], 
        key, len, idx ;
        
    for(key in status) if (status[key]>0) statsum.push(_text(key));
    
    len = this.assertions.length;
    for(idx=0;idx<len;idx++) assertions.push(this.assertions[idx].emit());
    assertions = assertions.join('');
    
    return utils.fmt(this.template, statsum, _text(this.name), assertions, status.passed, status.failed, status.errors, status.warnings);
  }
  
});

// knows how to emit a module
var ModuleEntry = utils.extend({
  
  init: function(owner, moduleName) {
    this.name = moduleName;
    this.owner = owner;
    this.entries = []; // add another module or test here
    this._modules = {}; // for lookup
    this._tests = {}; // for lookup
    this.didPass = true;
  },

  // add or get module by name
  module: function(moduleName) {
    if (this._modules[moduleName]) return this._modules[moduleName];
    var ret = new ModuleEntry(this, moduleName);
    this._modules[moduleName] = ret;
    this.entries.push(ret);
    return ret ;
  },
  
  // add or get a test by name
  test: function(testName) {
    if (this._tests[testName]) return this._tests[testName];
    var ret = new TestEntry(this, testName);
    this._tests[testName] = ret ;
    this.entries.push(ret);
    this.plan().tests++;
    return ret ;
  },
  
  pass: function(aFlag) {
    if (!aFlag) this.didPass = false;
    this.owner.pass(aFlag);
  },
  
  plan: function() { return this.owner.plan(); },
  
  template: ['<li class="module %@3">',
    '<span class="name">%@1</span>',
    '<ul>%@2</ul>',
  '</li>'].join(''),
  
  emit: function() {
    var assertions = [],
        key, len, idx;
        
    len = this.entries.length;
    for(idx=0;idx<len;idx++) assertions.push(this.entries[idx].emit());
    assertions = assertions.join('');
    
    var passed = this.didPass ? 'passed' : '';
    return utils.fmt(this.template, _text(this.name), assertions, passed);
  }

});

// knows how to emit a full plan
var PlanEntry = utils.extend({
  
  init: function(planName) {
    this.name = planName;
    this.entries = [];
    this._modules = {};
    this.passed = this.errors = this.failed = this.warnings = 0;
    this.tests = this.assertions = 0 ;
  },
  
  pass: function() { 
    // noop
  },
  
  plan: function() { return this; },
  
  module: function(moduleName) {
    if (this._modules[moduleName]) return this._modules[moduleName];
    var ret = new ModuleEntry(this, moduleName);
    this._modules[moduleName] = ret ;
    this.entries.push(ret);
    return ret;
  },
  
  template: ['<li class="plan">',
    '<span class="name">%@1</span>',
    '<ul>%@2</ul>',
  '</li>'].join(''),
  
  emit: function() {
    var assertions = [],
        key, len, idx;
        
    len = this.entries.length;
    for(idx=0;idx<len;idx++) assertions.push(this.entries[idx].emit());
    assertions = assertions.join('');
    
    return utils.fmt(this.template, _text(this.name), assertions);
  }

});


// default template used for display.  Note we use classes here - not IDs.  
// This way multiple instances can be on the same page at once.
var html = ['<div class="core-test">',
  '<div class="useragent">UserAgent</div>',
  '<div class="testresult">',
    '<label class="hide-passed">',
      '<input type="checkbox" checked="" /> Hide passed tests',
    '</label>',
    '<span class="final-status">Running...</span>',
  '</div>',
  '<ul class="detail">',
  '</ul>',
'</div>'].join('');


/**
  BrowserLogger logs output to the HTML display in a browser.
  
  @extends Ct.DefaultLogger
*/
Ct.BrowserLogger = utils.extend(Ct.DefaultLogger, 
  /** @scope Ct.DummyLogger.prototype */{
  
  name: 'browser',

  init: function() {
    
    console.log('init!');
    
    Ct.DefaultLogger.prototype.init.apply(this, arguments);
    this.plans = [];
    
    this.status = { 
      passed: 0, 
      failed: 0, 
      errors: 0, 
      warnings: 0, 
      tests: 0, 
      assertions: 0 
    }; 
  },
  
  setupDisplay: function() {
    
    console.log('setupDisplay');
    
    if (this._displayWasSetup) return;
    this._displayWasSetup = true ;
    
    var layer, logger;
    
    layer = this.layer = $(html);
    $('body').append(layer);
    
    // write in the user agent
    layer.find('.useragent').text(navigator.userAgent);
    
    // listen to change event
    this.checkboxLayer = layer.find('.hide-passed input[type=checkbox]');
    logger = this;
    this.checkboxLayer.change(function() {
      logger.hidePassedTestsDidChange(logger.checkboxLayer.attr('checked'));
    }); 
    
  },
  
  hidePassedTestsDidChange: function(aFlag) {
    this.setupDisplay();
    if (aFlag) this.layer.find('ul.detail').addClass('hide-passed');
    else this.layer.find('ul.detail').removeClass('hide-passed');
  },

  emit: function(plan) {
    this.setupDisplay();
    var status = this.status, 
        ret, idx, key;
        
    ret = plan.emit();
    this.layer.find('ul.detail').append($(ret));    

    for(key in status) {
      if (!status.hasOwnProperty(key)) continue;
      status[key] += plan[key];
    }
    this.summarize(status);
  },

  summarize: function(status) {
    this.setupDisplay();
    var ret = [];
    ret.push(utils.fmt('Completed %@ assertions in %@ tests: ', status.assertions, status.tests));
    ret.push(utils.fmt('<span class="passed">%@ passed</span>', status.passed));
    
    var key, hasErrors;
    hasErrors = (status.failed + status.errors + status.warnings)>0;
    if (hasErrors) {
      for(key in status) {
        if (!status.hasOwnProperty(key) || (key==='passed')) continue;
        if ((key==='tests') || (key==='assertions')) continue;
        ret.push(utils.fmt('<span class="%@1">%@2 %@1</span>', key, status[key]));
      }
    }
    
    this.layer.find('.final-status').html(ret.join(''));
    
    var checkbox = this.layer.find('.hide-passed input');
    if (hasErrors) {
      checkbox.attr('disabled', false).attr('checked', true);
      this.hidePassedTestsDidChange(true);
    } else {
      checkbox.attr('disabled', true).attr('checked', false);
      this.hidePassedTestsDidChange(false);
    }
    checkbox = null;
  },
  
  // ..........................................................
  // CORE API - Overide in your subclass
  // 
  
  begin: function(planName) {
    var plan = new PlanEntry(planName);
    this.plans.push(plan);
    this.currentPlan = plan;
  },
  
  end: function(planName) {
    this.emit(this.currentPlan); 
    this.currentPlan = null;
  },

  
  add: function(status, testInfo, message) {
    
    var plan = this.currentPlan;
    if (!plan) throw "add called outside of plan";
    
    var testName = testInfo.testName,
        moduleNames = testInfo.moduleNames,
        len = moduleNames ? moduleNames.length : 0,
        idx, cur ;

    if (len===0) {
      moduleNames = ['default']; len = 1;  
    }
    
    cur = plan;
    for(idx=0;idx<len;idx++) cur = cur.module(moduleNames[idx]);
    cur = cur.test(testName);
    cur.add(status, message);
  }
});

// make available to those directly importing this module
exports = module.exports = Ct.BrowserLogger;
exports.BrowserLogger = Ct.BrowserLogger;

