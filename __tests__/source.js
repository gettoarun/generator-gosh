'use strict';
const path = require('path');
const helpers = require('yeoman-test');

describe('generator-gosh:source', () => {
  beforeAll(() => {
    return helpers
      .run(path.join(__dirname, '../generators/source'))
      .withPrompts({ someAnswer: true });
  });
});
