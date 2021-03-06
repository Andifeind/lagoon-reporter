'use strict';

let inspect = require('inspect.js');

describe('Lagoon reporter', function() {
  describe('Test run', function() {
    it.skip('Should pass a test', function() {
      inspect(true).isTrue();
    });

    it.skip('Should fail a test', function() {
      inspect(false).isTrue();
    });

    it.skip('Should pass as well', function() {
      inspect(false).isFalse();
    });

    it.skip('Should be skipped', function() {
      inspect('skip').isString();
    });
  });
});
