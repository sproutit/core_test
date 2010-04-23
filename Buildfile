# ===========================================================================
# Project:   CoreTest
# Copyright: ©2009 Apple Inc.
# ===========================================================================

config :core-test, 
  :required       => [:tiki],
  :debug_required => [],
  :test_required  => [],
  :use_modules    => true,
  :use_loader     => true,
  :factory_format => :function,
  :module_lib  => ['lib'], # make compatible w/ packages.json
  :combine_javascript => true,
  :combine_stylesheets => true
