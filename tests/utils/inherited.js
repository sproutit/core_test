// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct    = require('core'),
    utils = require('utils');

var keysFor = function(obj) {
  var ret = [];
  for(var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    ret.push(key);
  }
  
  return ret.sort();
};

Ct.module("core_test:utils inherited functions");

Ct.test("should have all properties found in tiki module", function(t) {
  var tk = require('tiki'), key;
  for(key in tk) {
    if (!tk.hasOwnProperty(key)) continue;
    t.notStrictEqual(utils[key], undefined, 'utils should contain ' + key);
  }
});

Ct.run();