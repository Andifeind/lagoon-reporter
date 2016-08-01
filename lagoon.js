'use strict';

let cf = require('colorfy');
let jsdiff = require('diff');
let fluf = require('fluf');

let indention = 0;

let stringDiff = function(actual, expected) {
  let str = cf();

  if (typeof actual === 'object' && typeof expected === 'object') {
    actual = JSON.stringify(actual, null, '  ');
    expected = JSON.stringify(expected, null, '  ');
  }

  let left = fluf(String(actual)).split();
  let right = fluf(String(expected)).split();

  let indentLeft = Math.max(left.longestItem(), 20);
  let indentRight = Math.max(right.longestItem(), 20);

  str.green('expected:', 'trim').txt(' '.repeat(indentLeft - 7), 'trim');
  str.red('actual:', 'trim').txt(' '.repeat(indentRight - 5), 'trim').nl();
  str.grey('-'.repeat(indentLeft), 'trim').txt('  ', 'trim');
  str.grey('-'.repeat(indentRight), 'trim').nl(2);

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    let diff = jsdiff.diffChars(left.get(i, ''), right.get(i, ''));
    let lineLength = 0;
    diff.forEach(part => {
      if (part.removed) {
        str.green(part.value, 'trim');
        lineLength += part.value.length;
      }
      else if (!part.added) {
        str.txt(part.value, 'trim');
        lineLength += part.value.length;
      }
    });

    str.txt(' '.repeat(indentLeft - lineLength + 2), 'trim')

    diff.forEach(part => {
      if (part.added) {
        str.red(part.value, 'trim');
        lineLength += part.value.length;
      }
      else if (!part.removed) {
        str.txt(part.value, 'trim');
        lineLength += part.value.length;
      }
    });

    str.nl();
  }

  return str;
}

let indent = function(str) {
  if (str === undefined) {
    return ' '.repeat(indention * 2);
  }

  if (typeof str !== 'string') {
    str = String(str);
  }

  return str
    .split(/\n/g)
    .map(line => {
      return ' '.repeat(indention * 2) + line
    })
    .join('\n');
};

let pluralize = function(num, sing, plur) {
  if (num && num === 1) {
    return sing;
  }

  return plur;
}

let humanize = function(hrtime) {
  let t = hrtime[0] * 1e9 + hrtime[1];
  let timeStr;

  if (t < 1e3) {
    timeStr = t + 'ns';
  }
  else if (t < 1e6) {
    timeStr = Math.floor(t / 1e3) + 'μs';
  }
  else if (t < 1e9) {
    timeStr = Math.floor(t / 1e6) + 'ms';
  }
  else {
    timeStr = Math.floor(t / 1e9) + 's';
  }

  return {
    time: t,
    toString: () => timeStr
  };
}

function LagoonReporter(runner) {
  let passed = 0;
  let failed = 0;
  let skiped = 0;
  let testStart;
  let suiteStart;

  runner.on('start', () => {
    cf(indent()).grey('Start test runner').print();
    suiteStart = process.hrtime();
  });

  runner.on('suite', function(suite) {
    if (!suite.title) {
      return;
    }

    ++indention;
    cf(indent('›')).azure(suite.title, 'bold').print()
  });

  runner.on('suite end', function() {
    --indention;
      // process.sdtout.print('\n')
  });

  runner.on('pass', function(test) {
    let duration = process.hrtime(testStart);
    duration = humanize(duration);

    ++passed;
    let log = cf(indent() + ' ').green('✔').llgrey(test.fullTitle());

    log.grey('(', 'rtrim');

    if (duration.time < 1e6) {
      log.green(duration);
    }
    else if (duration.time > 4.9e6) {
      log.red(duration);
    }
    else if (duration.time > 1e7) {
      log.orange(duration);
    }
    else {
      log.lime(duration);
    }

    log.grey(')', 'ltrim');
    log.print();
  });

  runner.on('pending', function(test) {
    ++skiped;
    cf(indent() + ' ').azure('⚡').ddgrey(test.fullTitle()).print();
  });

  runner.on('fail', function(test, err) {
    ++failed;
    cf(indent() + ' ').red('✘').grey(test.fullTitle()).txt('\n').print();
    cf(indent() + '   ').lgrey(err.message).nl().print();
    if (err.hasOwnProperty('actual') && err.hasOwnProperty('expected')) {
      let diffStr = stringDiff(err.actual, err.expected).colorfy();
      console.log(fluf(diffStr).indent(' ', indention + 6), '\n'); // eslint-disable-line
    }
  });

  runner.on('test', function(test, err) {
    testStart = process.hrtime();
  });


  runner.on('end', function() {
    let runtime = process.hrtime(suiteStart);

    cf().lgrey('\n \u2702' + ' –'.repeat(33))
      .txt('\n')
      .green('   ' + passed).grey(pluralize(passed, 'test passed\n', 'tests passed\n'))
      .red('   ' + failed).grey(pluralize(failed, 'test failed\n', 'tests failed\n'))
      .azure('   ' + skiped).grey(pluralize(skiped, 'test skipped\n', 'tests skipped\n'))
      .llgrey('\n   All tests have been done in').green(humanize(runtime))
      .txt('\n\n')
      .print();

    process.exit(failed);
  });
}

module.exports = LagoonReporter;
