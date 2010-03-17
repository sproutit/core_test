// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals CoreTest exports */

var utils = require('utils'), 
    Ct    = require('core');

/** @namespace

  Just like CoreTest except we by default assume tests are async unless they 
  return a promise or callback.
*/
exports = module.exports = utils.beget(Ct);

function sync(handler) {
  return function(t, done) {
    var ret = handler(t);
    
    // returns a continuable - invoke with done handler
    if ('function' === typeof ret) ret(done);
    
    // returns a promise - add listener
    else if (ret && ('function'===typeof ret.then)) {
      ret.then(function() { done(); }, function(e) { done(e); });
      
    // sync - return result
    } else done();
  };
}

exports.setup = function(handler) {
  Ct.setup(sync(handler));
  return this;
};

exports.teardown = function(handler) {
  Ct.teardown(sync(handler));
  return this;
};

exports.test = function(testName, handler) {
  Ct.test(testName, sync(handler));
  return this;
};

['module', 'run', 'then', 'asset', 'error', 'info'].forEach(function(key) {
  exports[key] = function() {
    Ct[key].apply(Ct, arguments);
    return this;
  };
});
