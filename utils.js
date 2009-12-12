// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals fmt */

// add the tiki utils into this module.  this way other modules don't have to
// import tiki:utils
"import tiki:utils";
"export T_ERROR T_OBJECT T_NULL T_CLASS T_HASH T_FUNCTION T_UNDEFINED T_NUMBER T_BOOL T_ARRAY T_STRING T_BOOLEAN YES NO";
"export typeOf $A guidFor mixin beget extend";

// also add some utils
"export fmt";


/** Borrowed from SproutCore Runtime Core */
fmt = function fmt(str) {
  // first, replace any ORDERED replacements.
  var args = arguments;
  var idx  = 1; // the current index for non-numerical replacements
  return str.replace(/%@([0-9]+)?/g, function(s, argIndex) {
    argIndex = (argIndex) ? parseInt(argIndex,0) : idx++ ;
    s =args[argIndex];
    return ((s===null) ? '(null)' : (s===undefined) ? '' : s).toString(); 
  }) ;
};