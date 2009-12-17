// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals exports */

var CoreTest = require('core'),
    $ = require('browser/jquery'),
    utils = require('utils');

var BrowserLogger, logger;

/**
  The BrowserLogger can be used to log test output to the main web page.  
*/
BrowserLogger = utils.extend({

  init: function() {
    this.stats = {
      tests: 0, passed: 0, failed: 0, total: 0, errors: 0, warnings: 0
    };
    return this ;
  },
  
  testCount: 0,
  
  planDidBegin: function(plan) {
    if (!this.report) {
      // setup the report DOM element.
      this.report = $(['<div class="core-test">',
        '<div class="useragent">UserAgent</div>',
        '<div class="testresult">',
          '<label class="hide-passed">',
            '<input type="checkbox" checked="checked" /> Hide passed tests',
          '</label>',
          '<span class="status">Running...</span>',
        '</div>',
        '<div class="detail">',
          '<table>',
            '<thead><tr>',
              '<th class="desc">Test</th><th>Result</th>',
            '</tr></thead>',
            '<tbody><tr></tr></tbody>',
          '</table>',
        '</div>',
      '</div>'].join(''));


      this.report.find('.useragent').html(navigator.userAgent);
      this.logq = this.report.find('tbody');
      this.testCount = 0 ;

      // listen to change event
      var runner = this;
      this.checkbox = this.report.find('.hide-passed input'); 
      this.checkbox.change(function() {
        runner.hidePassedTestsDidChange();
      });

      $('body').append(this.report);
      
      this._startTime = new Date().getTime();
    }
    
    this._plan = plan ;
    return this ;
  },
  
  planDidEnd: function(plan) {

    this.scheduleFlushResult();
    this.scheduleFlush();
    //this.flush();
    
    var r = this.stats;
    if (this._startTime) {
      r.runtime = new Date().getTime() - this._startTime;
    } else r.runtime = 0;
    
    var result = this.report.find('.testresult .status');
    
    var str = utils.fmt('<span>Completed %@ tests in %@ msec. </span>'
              +'<span class="total">%@</span> total assertions: ', r.tests, 
              r.runtime, r.total);
    
    if (r.passed > 0) {
      str += utils.fmt('&nbsp;<span class="passed">%@ passed</span>', r.passed);
    }
    
    if (r.failed > 0) {
      str += utils.fmt('&nbsp;<span class="failed">%@ failed</span>', r.failed);
    }

    if (r.errors > 0) {
      str += utils.fmt('&nbsp;<span class="errors">%@ error%@</span>', 
            r.errors, (r.errors !== 1 ? 's' : ''));
    }

    if (r.warnings > 0) {
      str += utils.fmt('&nbsp;<span class="warnings">%@ warnings%@</span>',
            r.warnings, (r.warnings !== 1 ? 's' : ''));
    }

    // if all tests passed, disable hiding them.  if some tests failed, hide
    // them by default.
    if (this.errors) this.errors.push('</tr></tbody></table>');
    if ((r.failed + r.errors + r.warnings) > 0) {
      this.hidePassedTestsDidChange(); // should be checked by default
    } else {
      this.report.find('.hide-passed').addClass('disabled')
        .find('input').attr('disabled', true);
      if (this.errors) this.errors.length = 0;
    }     
    if(CoreTest.showUI) $('.core-test').css("right", "360px");
    this.resultStr = str;
    
    if (this.errors) CoreTest.errors=this.errors.join('');
    this._plan = null;
    return this ;
  },
  
  moduleDidBegin: function(moduleName) {
    if (!this._modules) this._modules = [];
    this._modules.push(moduleName);
    return this ;
  },
  
  moduleDidEnd: function(moduleName) {
    if (this._modules) this._modules.pop();
    return this ;
  },
  
  testDidBegin: function(testName) {
    if (!this._tests) this._tests = [];
    this._tests.push(testName);
    
    if (!this._assertions) this._assertions = [];
    this._assertions.push([]);
    this._timings = { total_begin: new Date().getTime(), total_end: 0 };
    this.stats.tests++;
    return this ;
  },
  
  testDidEnd: function(testName) {
    var p = this._plan,  
        m = this._modules, 
        t = this._tests,
        a = this._assertions;
        
    m = (m && m.length>0) ? m[m.length-1] : '' ;
    t = (t && t.length>0) ? t[t.length-1] : '';
    a = (a && a.length>0) ? a[a.length-1] : {};
     
    this._timings.total_end = new Date().getTime();
    this.planDidRecord(p, m, t, a);
    if (this._assertions) this._assertions.pop();
    if (this._tests) this._tests.pop();
    return this ;
  },
  
  planDidRecord: function(plan, module, test, assertions) {
    var name = test, 
        s    = { passed: 0, failed: 0, errors: 0, warnings: 0 }, 
        len  = assertions.length, 
        clean = '', 
        idx, cur, q;
    
    var timings = this._timings ;
    if (!timings) timings = this._timings = {};
    
    for(idx=0;idx<len;idx++) s[assertions[idx].result]++;
    if ((s.failed + s.errors + s.warnings) === 0) clean = "clean" ;
    
    if (module) name = module.replace(/\n/g, '<br />') + " module: " + test ;
    name = utils.fmt('%@ - %@msec', name, timings.total_end - timings.total_begin);
    
    // place results into a single string to append all at once.
    var logstr = this.logstr ;
    var errors =this.errors;
    if (!logstr) logstr = this.logstr = [];
    if (!this.errors) {
      this.errors = ['<style type="text/css">* {font: 12px arial;}'+
                    '.passed { background-color: #80D175; color: white;}'+
                    '.failed { background-color: #ea4d4; color: black; }'+
                    '.errors { background-color: red; color: black; }'+
                    '.warnings { background-color: #E49723; color: black;}'+
                    '.desc { text-align: left;}'+
                    '</style><table style="border:1px solid"><thead>'+
                    '<tr><th class="desc">'+navigator.userAgent+
                    '</th><th>Result</th></tr>'+
                    '</thead><tbody><tr>'];
    }
    logstr.push(utils.fmt('<tr class="test %@"><th class="desc" colspan="2">'+
          '%@ (<span class="passed">%@</span>, <span class="failed">%@</span>,'+
          ' <span class="errors">%@</span>, <span class="warnings">%@</span>)'+
          '</th></tr>', clean, name, s.passed, s.failed, s.errors, s.warnings));
    if(s.failed>0 || s.errors>0){
      this.errors.push(utils.fmt('<tr class="test %@">'+
          '<th style="background:grey; color:white" class="desc" colspan="2">'+
          '%@ (<span class="passed">%@</span>, <span class="failed">%@</span>'+
          ', <span class="errors">%@</span>, <span class="warnings">%@</span>'+
          ')</th></tr>', clean, name, s.passed, s.failed, s.errors, s.warnings));  
    }
    
    len = assertions.length;
    for(idx=0;idx<len;idx++) {
      cur = assertions[idx];
      clean = cur.result === 'passed' ? 'clean' : 'dirty';
      logstr.push(utils.fmt('<tr class="%@"><td class="desc">%@</td>'
          +'<td class="action %@">%@</td></tr>', clean, cur.message, cur.result, 
          (cur.result || '').toUpperCase()));
      if(clean=='dirty'){
        this.errors.push(utils.fmt('<tr class="%@"><td class="desc">%@</td>'
        +'<td class="action %@">%@</td></tr>', clean, cur.message, cur.result,
        (cur.result || '').toUpperCase()));
      }
    }
    
    this.testCount++;
    //this.resultStr = utils.fmt("Running – Completed %@ tests so far.", this.testCount);
  },
  
  assertion: function(newAssertion) {
    var a = this._assertions ;
    if (a) a = a[a.length-1]; 
    if (a) a.push(newAssertion);
    this.stats.total++;
    return this ;
  },
  
  info: function(msg) {
    this.assertion({ message: msg, result: 'passed' });
    this.stats.passed++;
    return this;
  },
  
  error: function(msg) {
    this.assertion({ message: msg, result: 'errors' });
    this.stats.errors++;
    return this;
  },
  
  warn: function(msg) {
    this.assertion({ message: msg, result: 'warnings' });
    this.stats.warnings++;
    return this;
  },
  
  debug: function(msg) {
    //this.assertions().push({ message: msg, result: 'failed' });
  },
  
  // ..........................................................
  // SUPPORT METHODS
  // 
  
  hidePassedTestsDidChange: function() {
    var checked = !!this.checkbox.val();
        
    if (checked) {
      this.logq.addClass('hide-clean');
    } else {
      this.logq.removeClass('hide-clean');
    }
  },
  
  // flush result once every 100 msec
  scheduleFlushResult: function() {
    if (this._flushResultTimer) return this;

    var f = this._scheduleFlushResult;
    if (!f) {
      var logger = this ;
      f = this._scheduleFlushResult = function() {
        logger._flushResultTimer = null;
        logger.flush(true);
      };
    }
    
    this._flushResultTimer = setTimeout(f, 250);
  },
  
  
  // schedules a complete flush to happen 250msec.  Reset after each call
  scheduleFlush: function() {  

    var f = this._scheduleFlush;
    if (!f) {
      var logger = this ;
      f = this._scheduleFlush = function() {
        logger._flushTimer = null;
        logger.flush();
      };
    }

    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(f, 100);
  },
  
  // flush any pending HTML changes...
  flush: function(resultOnly) {
    var logstr = this.logstr,
        resultStr = this.resultStr,
        result = this.report.find('.testresult .status');

    if (!resultOnly && logstr) {
      this.logq.append(this.logstr.join('')) ;
      this.logstr = null;
    }
    
    if (resultStr) result.html(resultStr);
    this.resultStr = null ;
  }
  
});

exports.BrowserLogger = BrowserLogger;
exports.logger = new BrowserLogger();
