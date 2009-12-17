// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals exports module */

var utils = require('utils','default');
exports = module.exports = utils.beget(utils); // woah meta!

/** Borrowed from SproutCore Runtime Core */
exports.fmt = function fmt(str) {
  // first, replace any ORDERED replacements.
  var args = arguments;
  var idx  = 1; // the current index for non-numerical replacements
  return str.replace(/%@([0-9]+)?/g, function(s, argIndex) {
    argIndex = (argIndex) ? parseInt(argIndex,0) : idx++ ;
    s =args[argIndex];
    return ((s===null) ? '(null)' : (s===undefined) ? '' : s).toString(); 
  }) ;
};
