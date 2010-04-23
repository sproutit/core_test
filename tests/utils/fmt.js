// ==========================================================================
// Project:   CoreTest Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Ct = require('core'),
    ut = require('utils');
        
Ct.module('core-test:utils.fmt');

Ct.test("should interpolate % @", function(t, done) {
  t.equal(ut.fmt('%@ is %@', 'foo', 'bar'), 'foo is bar', 'interpolate %@ is %@');
  done();
});

Ct.test('should interpolate positional items', function(t, done) {
  t.equal(ut.fmt('%@2 is %@1', 'foo', 'bar'), 'bar is foo', 'should interpolate %@# as positional');
  done();
});

Ct.run();
